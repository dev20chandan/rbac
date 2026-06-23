import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { CreateModuleDto, UpdateModuleDto } from './dto/module.dto';
import { RequirePermission } from '../common/decorators/require-permission.decorator';

@Controller('modules')
export class ModulesController {
    constructor(private modulesService: ModulesService) { }

    @Get()
    @RequirePermission('settings', 'view')
    async findAll() {
        const modules = await this.modulesService.findAll();
        return { message: 'Modules fetched', data: modules };
    }

    @Get(':id')
    @RequirePermission('settings', 'view')
    async findOne(@Param('id') id: string) {
        const module = await this.modulesService.findOne(id);
        return { message: 'Module fetched', data: module };
    }

    @Post()
    @RequirePermission('settings', 'create')
    async create(@Body() dto: CreateModuleDto) {
        const module = await this.modulesService.create(dto);
        return { message: 'Module created with permissions', data: module };
    }

    @Put(':id')
    @RequirePermission('settings', 'edit')
    async update(@Param('id') id: string, @Body() dto: UpdateModuleDto) {
        const module = await this.modulesService.update(id, dto);
        return { message: 'Module updated', data: module };
    }

    @Delete(':id')
    @RequirePermission('settings', 'delete')
    async remove(@Param('id') id: string) {
        const result = await this.modulesService.remove(id);
        return { message: result.message, data: null };
    }
}
