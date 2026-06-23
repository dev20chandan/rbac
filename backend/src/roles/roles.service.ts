import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Role, RoleDocument } from './schemas/role.schema';
import { RolePermission, RolePermissionDocument } from '../permissions/schemas/role-permission.schema';
import { Permission, PermissionDocument } from '../permissions/schemas/permission.schema';
import { CreateRoleDto, UpdateRoleDto, AssignPermissionsDto } from './dto/role.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class RolesService {
    constructor(
        @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
        @InjectModel(RolePermission.name) private rolePermissionModel: Model<RolePermissionDocument>,
        @InjectModel(Permission.name) private permissionModel: Model<PermissionDocument>,
        private auditLogsService: AuditLogsService,
    ) { }

    async create(dto: CreateRoleDto, actorId?: Types.ObjectId) {
        const existing = await this.roleModel.findOne({ slug: dto.slug.toLowerCase(), isDeleted: false });
        if (existing) throw new ConflictException('Role slug already exists');

        const role = await this.roleModel.create({ ...dto, slug: dto.slug.toLowerCase() });

        if (actorId) {
            await this.auditLogsService.log({
                userId: actorId,
                action: 'CREATE',
                resource: 'Role',
                resourceId: role._id as Types.ObjectId,
                newValue: { name: role.name },
                status: 'success',
            });
        }

        return role;
    }

    async findAll() {
        return this.roleModel.find({ isDeleted: false }).sort({ hierarchy: 1 }).lean();
    }

    async findOne(id: string) {
        const role = await this.roleModel.findOne({ _id: id, isDeleted: false }).lean();
        if (!role) throw new NotFoundException('Role not found');
        return role;
    }

    async update(id: string, dto: UpdateRoleDto, actorId?: Types.ObjectId) {
        const role = await this.roleModel.findOne({ _id: id, isDeleted: false });
        if (!role) throw new NotFoundException('Role not found');

        const updated = await this.roleModel.findByIdAndUpdate(id, dto, { new: true }).lean();

        if (actorId) {
            await this.auditLogsService.log({
                userId: actorId,
                action: 'UPDATE',
                resource: 'Role',
                resourceId: new Types.ObjectId(id),
                status: 'success',
            });
        }

        return updated;
    }

    async remove(id: string, actorId?: Types.ObjectId) {
        const role = await this.roleModel.findOne({ _id: id, isDeleted: false });
        if (!role) throw new NotFoundException('Role not found');
        if (role.isSuperAdmin) throw new BadRequestException('Cannot delete super admin role');

        await this.roleModel.findByIdAndUpdate(id, { isDeleted: true });
        // Clean up role permissions
        await this.rolePermissionModel.deleteMany({ role: id });

        if (actorId) {
            await this.auditLogsService.log({
                userId: actorId,
                action: 'DELETE',
                resource: 'Role',
                resourceId: new Types.ObjectId(id),
                status: 'success',
            });
        }

        return { message: 'Role deleted' };
    }

    async assignPermissions(roleId: string, dto: AssignPermissionsDto, actorId?: Types.ObjectId) {
        const role = await this.roleModel.findOne({ _id: roleId, isDeleted: false });
        if (!role) throw new NotFoundException('Role not found');

        // Validate all permission IDs exist
        const permissions = await this.permissionModel.find({
            _id: { $in: dto.permissionIds.map(id => new Types.ObjectId(id)) },
        });
        if (permissions.length !== dto.permissionIds.length) {
            throw new BadRequestException('One or more permission IDs are invalid');
        }

        // Replace existing permissions: delete old, insert new
        await this.rolePermissionModel.deleteMany({ role: roleId });

        const docs = dto.permissionIds.map(permId => ({
            role: new Types.ObjectId(roleId),
            permission: new Types.ObjectId(permId),
        }));

        if (docs.length > 0) {
            await this.rolePermissionModel.insertMany(docs);
        }

        if (actorId) {
            await this.auditLogsService.log({
                userId: actorId,
                action: 'ASSIGN_PERMISSIONS',
                resource: 'Role',
                resourceId: new Types.ObjectId(roleId),
                newValue: { permissionIds: dto.permissionIds },
                status: 'success',
            });
        }

        return { message: 'Permissions assigned', count: docs.length };
    }

    async getRolePermissions(roleId: string) {
        const role = await this.roleModel.findOne({ _id: roleId, isDeleted: false });
        if (!role) throw new NotFoundException('Role not found');

        const rolePerms = await this.rolePermissionModel
            .find({ role: roleId })
            .populate({
                path: 'permission',
                populate: { path: 'module', select: 'name slug' },
            })
            .lean();

        return rolePerms.map(rp => rp.permission);
    }
}
