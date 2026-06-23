import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Permission, PermissionDocument } from './schemas/permission.schema';
import { RolePermission, RolePermissionDocument } from './schemas/role-permission.schema';
import { UserPermission, UserPermissionDocument } from './schemas/user-permission.schema';
import { OverrideUserPermissionDto } from './dto/permission.dto';

@Injectable()
export class PermissionsService {
    constructor(
        @InjectModel(Permission.name) private permissionModel: Model<PermissionDocument>,
        @InjectModel(RolePermission.name) private rolePermissionModel: Model<RolePermissionDocument>,
        @InjectModel(UserPermission.name) private userPermissionModel: Model<UserPermissionDocument>,
    ) { }

    async findAll() {
        return this.permissionModel
            .find()
            .populate('module', 'name slug')
            .sort({ slug: 1 })
            .lean();
    }

    async findByModule(moduleId: string) {
        return this.permissionModel
            .find({ module: new Types.ObjectId(moduleId) })
            .lean();
    }

    /**
     * Calculate final effective permissions for a user
     * Formula: Role Permissions + User Allow Overrides - User Deny Overrides
     */
    async getUserEffectivePermissions(userId: string, roleId: string): Promise<string[]> {
        // Get all role permissions
        const rolePerms = await this.rolePermissionModel
            .find({ role: new Types.ObjectId(roleId) })
            .populate('permission')
            .lean();

        const rolePermSet = new Set(
            rolePerms.map((rp: any) => rp.permission.slug as string),
        );

        // Get user overrides
        const userOverrides = await this.userPermissionModel
            .find({ user: new Types.ObjectId(userId) })
            .populate('permission')
            .lean();

        for (const override of userOverrides as any[]) {
            const slug = override.permission.slug as string;
            if (override.type === 'allow') {
                rolePermSet.add(slug);
            } else if (override.type === 'deny') {
                rolePermSet.delete(slug);
            }
        }

        return Array.from(rolePermSet);
    }

    // ─── User Permission Overrides ────────────────────────────────────────────

    async getUserOverrides(userId: string) {
        return this.userPermissionModel
            .find({ user: new Types.ObjectId(userId) })
            .populate({ path: 'permission', populate: { path: 'module', select: 'name slug' } })
            .lean();
    }

    async setUserOverride(userId: string, dto: OverrideUserPermissionDto) {
        const permission = await this.permissionModel.findById(dto.permissionId);
        if (!permission) throw new NotFoundException('Permission not found');

        await this.userPermissionModel.findOneAndUpdate(
            { user: new Types.ObjectId(userId), permission: new Types.ObjectId(dto.permissionId) },
            { type: dto.type },
            { upsert: true, new: true },
        );

        return { message: `Permission ${dto.type}ed for user` };
    }

    async removeUserOverride(userId: string, permissionId: string) {
        await this.userPermissionModel.findOneAndDelete({
            user: new Types.ObjectId(userId),
            permission: new Types.ObjectId(permissionId),
        });
        return { message: 'Override removed' };
    }
}
