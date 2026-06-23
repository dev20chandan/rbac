import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { Permission, PermissionSchema } from './schemas/permission.schema';
import { RolePermission, RolePermissionSchema } from './schemas/role-permission.schema';
import { UserPermission, UserPermissionSchema } from './schemas/user-permission.schema';
import { Role, RoleSchema } from '../roles/schemas/role.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Permission.name, schema: PermissionSchema },
            { name: RolePermission.name, schema: RolePermissionSchema },
            { name: UserPermission.name, schema: UserPermissionSchema },
            { name: Role.name, schema: RoleSchema },
        ]),
    ],
    controllers: [PermissionsController],
    providers: [PermissionsService],
    exports: [PermissionsService, MongooseModule],
})
export class PermissionsModule { }
