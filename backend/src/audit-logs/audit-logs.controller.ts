import { Controller, Get, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { RequirePermission } from '../common/decorators/require-permission.decorator';

@Controller('audit-logs')
export class AuditLogsController {
    constructor(private auditLogsService: AuditLogsService) { }

    @Get()
    @RequirePermission('settings', 'view')
    async findAll(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
        @Query('userId') userId?: string,
    ) {
        const result = await this.auditLogsService.findAll(page, limit, userId);
        return { message: 'Audit logs fetched', data: result };
    }
}
