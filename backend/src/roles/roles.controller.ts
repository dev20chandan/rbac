import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto, AssignPermissionsDto } from './dto/role.dto';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Types } from 'mongoose';

@Controller('roles')
export class RolesController {
    constructor(private rolesService: RolesService) { }

    @Get()
    @RequirePermission('settings', 'view')
    async findAll() {
        const roles = await this.rolesService.findAll();
        return { message: 'Roles fetched', data: roles };
    }

    @Get(':id')
    @RequirePermission('settings', 'view')
    async findOne(@Param('id') id: string) {
        const role = await this.rolesService.findOne(id);
        return { message: 'Role fetched', data: role };
    }

    @Post()
    @RequirePermission('settings', 'create')
    async create(@Body() dto: CreateRoleDto, @CurrentUser() actor: any) {
        const role = await this.rolesService.create(dto, actor._id as Types.ObjectId);
        return { message: 'Role created', data: role };
    }

    @Put(':id')
    @RequirePermission('settings', 'edit')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateRoleDto,
        @CurrentUser() actor: any,
    ) {
        const role = await this.rolesService.update(id, dto, actor._id as Types.ObjectId);
        return { message: 'Role updated', data: role };
    }

    @Delete(':id')
    @RequirePermission('settings', 'delete')
    async remove(@Param('id') id: string, @CurrentUser() actor: any) {
        const result = await this.rolesService.remove(id, actor._id as Types.ObjectId);
        return { message: result.message, data: null };
    }

    @Put(':id/permissions')
    @RequirePermission('settings', 'edit')
    async assignPermissions(
        @Param('id') id: string,
        @Body() dto: AssignPermissionsDto,
        @CurrentUser() actor: any,
    ) {
        const result = await this.rolesService.assignPermissions(id, dto, actor._id as Types.ObjectId);
        return { message: result.message, data: { count: result.count } };
    }

    @Get(':id/permissions')
    @RequirePermission('settings', 'view')
    async getRolePermissions(@Param('id') id: string) {
        const permissions = await this.rolesService.getRolePermissions(id);
        return { message: 'Role permissions fetched', data: permissions };
    }
}
