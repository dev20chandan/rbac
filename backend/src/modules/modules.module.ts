import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ModulesController } from './modules.controller';
import { ModulesService } from './modules.service';
import { AppModule as AppModuleSchema, AppModuleSchema as AppModuleMongooseSchema } from './schemas/module.schema';
import { Permission, PermissionSchema } from '../permissions/schemas/permission.schema';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: AppModuleSchema.name, schema: AppModuleMongooseSchema },
            { name: Permission.name, schema: PermissionSchema },
        ]),
        PermissionsModule,
    ],
    controllers: [ModulesController],
    providers: [ModulesService],
    exports: [ModulesService, MongooseModule],
})
export class ModulesModule { }
