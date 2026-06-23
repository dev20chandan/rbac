import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Role, RoleDocument } from '../roles/schemas/role.schema';
import { AppModule, AppModuleDocument } from '../modules/schemas/module.schema';
import { Permission, PermissionDocument } from '../permissions/schemas/permission.schema';
import { RolePermission, RolePermissionDocument } from '../permissions/schemas/role-permission.schema';

const PERMISSION_ACTIONS = ['view', 'create', 'edit', 'delete'] as const;

const DEFAULT_MODULES = [
    { name: 'Dashboard', slug: 'dashboard', route: '/dashboard', icon: 'LayoutDashboard', sortOrder: 1 },
    { name: 'Users', slug: 'users', route: '/dashboard/users', icon: 'Users', sortOrder: 2 },
    { name: 'Roles & Permissions', slug: 'settings', route: '/dashboard/settings', icon: 'Settings', sortOrder: 3 },
    { name: 'Categories', slug: 'categories', route: '/dashboard/categories', icon: 'Tag', sortOrder: 4 },
    { name: 'Subcategories', slug: 'subcategories', route: '/dashboard/subcategories', icon: 'Tags', sortOrder: 5 },
    { name: 'Products', slug: 'products', route: '/dashboard/products', icon: 'Package', sortOrder: 6 },
    { name: 'Orders', slug: 'orders', route: '/dashboard/orders', icon: 'ShoppingCart', sortOrder: 7 },
    { name: 'Payments', slug: 'payments', route: '/dashboard/payments', icon: 'CreditCard', sortOrder: 8 },
    { name: 'FAQ', slug: 'faq', route: '/dashboard/faq', icon: 'HelpCircle', sortOrder: 9 },
    { name: 'Pages', slug: 'pages', route: '/dashboard/pages', icon: 'FileText', sortOrder: 10 },
    { name: 'Audit Logs', slug: 'audit-logs', route: '/dashboard/audit-logs', icon: 'Activity', sortOrder: 11 },
];

const DEFAULT_ROLES = [
    { name: 'Super Admin', slug: 'super-admin', description: 'Full access to everything', isSuperAdmin: true, hierarchy: 0 },
    { name: 'Admin', slug: 'admin', description: 'Administrative access', hierarchy: 1 },
    { name: 'Manager', slug: 'manager', description: 'Manager access', hierarchy: 2 },
];

@Injectable()
export class SeedService implements OnApplicationBootstrap {
    private readonly logger = new Logger(SeedService.name);

    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
        @InjectModel(AppModule.name) private moduleModel: Model<AppModuleDocument>,
        @InjectModel(Permission.name) private permissionModel: Model<PermissionDocument>,
        @InjectModel(RolePermission.name) private rolePermissionModel: Model<RolePermissionDocument>,
    ) { }

    async onApplicationBootstrap() {
        await this.seed();
    }

    async seed() {
        try {
            this.logger.log('🌱 Starting database seeding...');

            // 1. Seed modules
            const createdModules = await this.seedModules();

            // 2. Seed permissions (auto-generated for each module)
            const permissions = await this.seedPermissions(createdModules);

            // 3. Seed roles
            const roles = await this.seedRoles();

            // 4. Assign all permissions to Super Admin role (by isSuperAdmin flag, not role_permissions)
            // Admin gets most permissions, Manager gets view-only

            const adminRole = roles.find(r => r.slug === 'admin');
            const managerRole = roles.find(r => r.slug === 'manager');

            if (adminRole) {
                await this.rolePermissionModel.deleteMany({ role: adminRole._id });
                await this.assignPermissionsToRole(adminRole._id as Types.ObjectId, permissions, ['view', 'create', 'edit']);
            }
            if (managerRole) {
                await this.rolePermissionModel.deleteMany({ role: managerRole._id });
                await this.assignPermissionsToRole(managerRole._id as Types.ObjectId, permissions, ['view']);
            }

            // 5. Seed default super admin user
            await this.seedUsers(roles);

            this.logger.log('✅ Database seeding completed successfully!');
        } catch (error) {
            this.logger.error('❌ Seeding failed:', error);
        }
    }

    private async seedModules() {
        const created: AppModuleDocument[] = [];

        for (const mod of DEFAULT_MODULES) {
            const existing = await this.moduleModel.findOne({ slug: mod.slug });
            if (!existing) {
                const created_mod = await this.moduleModel.create(mod);
                created.push(created_mod);
                this.logger.log(`  📦 Module created: ${mod.name}`);
            } else {
                created.push(existing);
            }
        }

        return created;
    }

    private async seedPermissions(modules: AppModuleDocument[]) {
        const permissions: PermissionDocument[] = [];

        for (const mod of modules) {
            for (const action of PERMISSION_ACTIONS) {
                const slug = `${mod.slug}:${action}`;
                let perm = await this.permissionModel.findOne({ slug });

                if (!perm) {
                    perm = await this.permissionModel.create({
                        module: mod._id,
                        action,
                        slug,
                        description: `${action} permission for ${mod.name}`,
                    });
                    this.logger.log(`  🔑 Permission created: ${slug}`);
                }

                permissions.push(perm);
            }
        }

        return permissions;
    }

    private async seedRoles() {
        const roles: RoleDocument[] = [];

        for (const roleData of DEFAULT_ROLES) {
            let role = await this.roleModel.findOne({ slug: roleData.slug });
            if (!role) {
                role = await this.roleModel.create(roleData);
                this.logger.log(`  👤 Role created: ${roleData.name}`);
            }
            roles.push(role);
        }

        return roles;
    }

    private async assignPermissionsToRole(
        roleId: Types.ObjectId,
        permissions: PermissionDocument[],
        actions: readonly string[],
    ) {
        const filteredPerms = permissions.filter(p => actions.includes(p.action));

        for (const perm of filteredPerms) {
            await this.rolePermissionModel.findOneAndUpdate(
                { role: roleId, permission: perm._id },
                { role: roleId, permission: perm._id },
                { upsert: true },
            );
        }
    }

    private async seedUsers(roles: RoleDocument[]) {
        const superAdminRole = roles.find(r => r.slug === 'super-admin');
        const adminRole = roles.find(r => r.slug === 'admin');
        const managerRole = roles.find(r => r.slug === 'manager');

        const defaultUsers = [
            {
                email: 'superadmin@rbac.com',
                firstName: 'Super',
                lastName: 'Admin',
                password: 'Admin@123',
                role: superAdminRole?._id,
            },
            {
                email: 'admin@rbac.com',
                firstName: 'John',
                lastName: 'Admin',
                password: 'Admin@123',
                role: adminRole?._id,
            },
            {
                email: 'manager@rbac.com',
                firstName: 'Jane',
                lastName: 'Manager',
                password: 'Admin@123',
                role: managerRole?._id,
            },
        ];

        for (const userData of defaultUsers) {
            const existing = await this.userModel.findOne({ email: userData.email });
            if (!existing) {
                const hashedPassword = await bcrypt.hash(userData.password, 12);
                await this.userModel.create({ ...userData, password: hashedPassword });
                this.logger.log(`  👤 User created: ${userData.email} (password: ${userData.password})`);
            }
        }
    }
}
