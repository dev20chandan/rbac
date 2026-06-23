import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppModule, AppModuleDocument } from '../modules/schemas/module.schema';
import { Role, RoleDocument } from '../roles/schemas/role.schema';
import { RolePermission, RolePermissionDocument } from '../permissions/schemas/role-permission.schema';
import { UserPermission, UserPermissionDocument } from '../permissions/schemas/user-permission.schema';
import { Permission, PermissionDocument } from '../permissions/schemas/permission.schema';

export interface SidebarItem {
    _id: string;
    name: string;
    slug: string;
    route: string;
    icon: string;
    sortOrder: number;
    permissions: string[];
    children: SidebarItem[];
}

@Injectable()
export class SidebarService {
    constructor(
        @InjectModel(AppModule.name) private moduleModel: Model<AppModuleDocument>,
        @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
        @InjectModel(RolePermission.name) private rolePermissionModel: Model<RolePermissionDocument>,
        @InjectModel(UserPermission.name) private userPermissionModel: Model<UserPermissionDocument>,
        @InjectModel(Permission.name) private permissionModel: Model<PermissionDocument>,
    ) { }

    async getSidebar(userId: Types.ObjectId, roleId: Types.ObjectId): Promise<SidebarItem[]> {
        // Step 1: Check if user is Super Admin
        const role = await this.roleModel.findById(roleId).lean();
        let effectivePermSlugs: Set<string>;

        if (role?.isSuperAdmin) {
            // Super Admin gets all permissions
            const allPerms = await this.permissionModel.find().lean();
            effectivePermSlugs = new Set(allPerms.map(p => p.slug));
        } else {
            // Step 2: Get role permissions
            const rolePerms = await this.rolePermissionModel
                .find({ role: roleId })
                .populate<{ permission: PermissionDocument }>('permission')
                .lean();

            const permSet = new Set(rolePerms.map((rp: any) => rp.permission.slug as string));

            // Step 3: Apply user overrides
            const userOverrides = await this.userPermissionModel
                .find({ user: userId })
                .populate<{ permission: PermissionDocument }>('permission')
                .lean();

            for (const override of userOverrides as any[]) {
                const slug = override.permission.slug as string;
                if (override.type === 'allow') permSet.add(slug);
                else if (override.type === 'deny') permSet.delete(slug);
            }

            effectivePermSlugs = permSet;
        }

        // Step 4: Get all active modules
        const allModules = await this.moduleModel
            .find({ isActive: true, isDeleted: false })
            .sort({ sortOrder: 1 })
            .lean();

        // Step 5: Filter modules the user has "view" permission for
        const accessibleModules = allModules.filter(mod =>
            effectivePermSlugs.has(`${mod.slug}:view`),
        );

        // Step 6: Build tree structure
        return this.buildTree(accessibleModules, effectivePermSlugs);
    }

    private buildTree(
        modules: any[],
        permSlugs: Set<string>,
        parentId: Types.ObjectId | null = null,
    ): SidebarItem[] {
        return modules
            .filter(mod => {
                const modParent = mod.parent ? mod.parent.toString() : null;
                const targetParent = parentId ? parentId.toString() : null;
                return modParent === targetParent;
            })
            .map(mod => {
                const modId = (mod._id as Types.ObjectId).toString();
                const permissions = ['view', 'create', 'edit', 'delete'].filter(action =>
                    permSlugs.has(`${mod.slug}:${action}`),
                );

                return {
                    _id: modId,
                    name: mod.name,
                    slug: mod.slug,
                    route: mod.route,
                    icon: mod.icon,
                    sortOrder: mod.sortOrder,
                    permissions,
                    children: this.buildTree(modules, permSlugs, mod._id as Types.ObjectId),
                };
            });
    }
}
