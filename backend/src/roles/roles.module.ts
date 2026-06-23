import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { Role, RoleSchema } from './schemas/role.schema';
import { RolePermission, RolePermissionSchema } from '../permissions/schemas/role-permission.schema';
import { Permission, PermissionSchema } from '../permissions/schemas/permission.schema';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Role.name, schema: RoleSchema },
            { name: RolePermission.name, schema: RolePermissionSchema },
            { name: Permission.name, schema: PermissionSchema },
        ]),
        PermissionsModule,
        AuditLogsModule,
    ],
    controllers: [RolesController],
    providers: [RolesService],
    exports: [RolesService, MongooseModule],
})
export class RolesModule { }
