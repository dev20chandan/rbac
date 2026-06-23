import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SidebarController } from './sidebar.controller';
import { SidebarService } from './sidebar.service';
import { AppModule as AppModuleSchema, AppModuleSchema as AppModuleMongooseSchema } from '../modules/schemas/module.schema';
import { Role, RoleSchema } from '../roles/schemas/role.schema';
import { RolePermission, RolePermissionSchema } from '../permissions/schemas/role-permission.schema';
import { UserPermission, UserPermissionSchema } from '../permissions/schemas/user-permission.schema';
import { Permission, PermissionSchema } from '../permissions/schemas/permission.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: AppModuleSchema.name, schema: AppModuleMongooseSchema },
            { name: Role.name, schema: RoleSchema },
            { name: RolePermission.name, schema: RolePermissionSchema },
            { name: UserPermission.name, schema: UserPermissionSchema },
            { name: Permission.name, schema: PermissionSchema },
        ]),
    ],
    controllers: [SidebarController],
    providers: [SidebarService],
    exports: [SidebarService],
})
export class SidebarModule { }
