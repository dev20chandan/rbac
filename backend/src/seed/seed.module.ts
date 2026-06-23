import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeedService } from './seed.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Role, RoleSchema } from '../roles/schemas/role.schema';
import { AppModule as AppModuleSchema, AppModuleSchema as AppModuleMongooseSchema } from '../modules/schemas/module.schema';
import { Permission, PermissionSchema } from '../permissions/schemas/permission.schema';
import { RolePermission, RolePermissionSchema } from '../permissions/schemas/role-permission.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: Role.name, schema: RoleSchema },
            { name: AppModuleSchema.name, schema: AppModuleMongooseSchema },
            { name: Permission.name, schema: PermissionSchema },
            { name: RolePermission.name, schema: RolePermissionSchema },
        ]),
    ],
    providers: [SeedService],
})
export class SeedModule { }
