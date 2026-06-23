import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

interface LogParams {
    userId: Types.ObjectId;
    action: string;
    resource: string;
    resourceId?: Types.ObjectId;
    oldValue?: Record<string, any>;
    newValue?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    status?: 'success' | 'failure';
}

@Injectable()
export class AuditLogsService {
    constructor(
        @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
    ) { }

    async log(params: LogParams) {
        return this.auditLogModel.create({
            user: params.userId,
            action: params.action,
            resource: params.resource,
            resourceId: params.resourceId,
            oldValue: params.oldValue,
            newValue: params.newValue,
            ipAddress: params.ipAddress,
            userAgent: params.userAgent,
            status: params.status || 'success',
        });
    }

    async findAll(page = 1, limit = 50, userId?: string) {
        const query: any = {};
        if (userId) query.user = new Types.ObjectId(userId);

        const [logs, total] = await Promise.all([
            this.auditLogModel
                .find(query)
                .populate('user', 'firstName lastName email')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            this.auditLogModel.countDocuments(query),
        ]);

        return { logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }
}
