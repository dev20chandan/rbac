import { Controller, Get } from '@nestjs/common';
import { SidebarService } from './sidebar.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Types } from 'mongoose';

@Controller('sidebar')
export class SidebarController {
    constructor(private sidebarService: SidebarService) { }

    @Get()
    async getSidebar(@CurrentUser() user: any) {
        const sidebar = await this.sidebarService.getSidebar(
            user._id as Types.ObjectId,
            user.role as Types.ObjectId,
        );
        return { message: 'Sidebar fetched', data: sidebar };
    }
}
