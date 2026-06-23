import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { REQUIRE_PERMISSION_KEY, PermissionRequirement } from '../decorators/require-permission.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { RolePermission, RolePermissionDocument } from '../../permissions/schemas/role-permission.schema';
import { UserPermission, UserPermissionDocument } from '../../permissions/schemas/user-permission.schema';
import { Permission, PermissionDocument } from '../../permissions/schemas/permission.schema';
import { Role, RoleDocument } from '../../roles/schemas/role.schema';

@Injectable()
export class PermissionGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        @InjectModel(RolePermission.name) private rolePermissionModel: Model<RolePermissionDocument>,
        @InjectModel(UserPermission.name) private userPermissionModel: Model<UserPermissionDocument>,
        @InjectModel(Permission.name) private permissionModel: Model<PermissionDocument>,
        @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Check if route is public
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) return true;

        const requirement = this.reflector.getAllAndOverride<PermissionRequirement>(
            REQUIRE_PERMISSION_KEY,
            [context.getHandler(), context.getClass()],
        );

        // No permission requirement = pass (rely on JwtAuthGuard)
        if (!requirement) return true;

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) throw new UnauthorizedException('Not authenticated');

        return this.checkPermission(user, requirement.module, requirement.action);
    }

    async checkPermission(
        user: { _id: Types.ObjectId; role: Types.ObjectId },
        moduleSlug: string,
        action: string,
    ): Promise<boolean> {
        // Fetch role to check superAdmin
        const role = await this.roleModel.findById(user.role).lean();
        if (role?.isSuperAdmin) return true; // Super Admin bypasses all permission checks

        // Find the permission document
        const permissionSlug = `${moduleSlug}:${action}`;
        const permission = await this.permissionModel.findOne({ slug: permissionSlug }).lean();
        if (!permission) {
            throw new ForbiddenException(`Permission '${permissionSlug}' does not exist`);
        }

        const permissionId = permission._id as Types.ObjectId;
        const userId = user._id;

        // Check user-level deny override (highest priority)
        const userDeny = await this.userPermissionModel.findOne({
            user: userId,
            permission: permissionId,
            type: 'deny',
        }).lean();
        if (userDeny) throw new ForbiddenException('Access denied');

        // Check user-level allow override
        const userAllow = await this.userPermissionModel.findOne({
            user: userId,
            permission: permissionId,
            type: 'allow',
        }).lean();
        if (userAllow) return true;

        // Check role-level permission
        const rolePermission = await this.rolePermissionModel.findOne({
            role: user.role,
            permission: permissionId,
        }).lean();

        if (!rolePermission) {
            throw new ForbiddenException('Insufficient permissions');
        }

        return true;
    }
}
