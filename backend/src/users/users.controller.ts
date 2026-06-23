import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    ParseIntPipe,
    DefaultValuePipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Types } from 'mongoose';

@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Get()
    @RequirePermission('users', 'view')
    async findAll(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
        @Query('search') search?: string,
    ) {
        const result = await this.usersService.findAll(page, limit, search);
        return { message: 'Users fetched', data: result };
    }

    @Get(':id')
    @RequirePermission('users', 'view')
    async findOne(@Param('id') id: string) {
        const user = await this.usersService.findOne(id);
        return { message: 'User fetched', data: user };
    }

    @Post()
    @RequirePermission('users', 'create')
    async create(@Body() dto: CreateUserDto, @CurrentUser() actor: any) {
        const user = await this.usersService.create(dto, actor._id as Types.ObjectId);
        return { message: 'User created', data: user };
    }

    @Put(':id')
    @RequirePermission('users', 'edit')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateUserDto,
        @CurrentUser() actor: any,
    ) {
        const user = await this.usersService.update(id, dto, actor._id as Types.ObjectId);
        return { message: 'User updated', data: user };
    }

    @Delete(':id')
    @RequirePermission('users', 'delete')
    async remove(@Param('id') id: string, @CurrentUser() actor: any) {
        const result = await this.usersService.remove(id, actor._id as Types.ObjectId);
        return { message: result.message, data: null };
    }
}
