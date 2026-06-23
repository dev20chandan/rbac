import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { OverrideUserPermissionDto } from './dto/permission.dto';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('permissions')
export class PermissionsController {
    constructor(private permissionsService: PermissionsService) { }

    @Get()
    @RequirePermission('settings', 'view')
    async findAll() {
        const permissions = await this.permissionsService.findAll();
        return { message: 'Permissions fetched', data: permissions };
    }

    @Get('my')
    async getMyPermissions(@CurrentUser() user: any) {
        const permissions = await this.permissionsService.getUserEffectivePermissions(
            user._id.toString(),
            user.role.toString(),
        );
        return { message: 'My permissions', data: permissions };
    }

    @Get('users/:userId')
    @RequirePermission('users', 'view')
    async getUserOverrides(@Param('userId') userId: string) {
        const overrides = await this.permissionsService.getUserOverrides(userId);
        return { message: 'User overrides fetched', data: overrides };
    }

    @Post('users/:userId/override')
    @RequirePermission('users', 'edit')
    async setUserOverride(
        @Param('userId') userId: string,
        @Body() dto: OverrideUserPermissionDto,
    ) {
        const result = await this.permissionsService.setUserOverride(userId, dto);
        return { message: result.message, data: null };
    }

    @Delete('users/:userId/override/:permissionId')
    @RequirePermission('users', 'edit')
    async removeUserOverride(
        @Param('userId') userId: string,
        @Param('permissionId') permissionId: string,
    ) {
        const result = await this.permissionsService.removeUserOverride(userId, permissionId);
        return { message: result.message, data: null };
    }
}
