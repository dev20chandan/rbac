import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true, collection: 'audit_logs' })
export class AuditLog {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user: Types.ObjectId;

    @Prop({ required: true })
    action: string; // e.g. "CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT"

    @Prop({ required: true })
    resource: string; // e.g. "User", "Role", "Permission"

    @Prop({ type: Types.ObjectId })
    resourceId?: Types.ObjectId;

    @Prop({ type: Object })
    oldValue?: Record<string, any>;

    @Prop({ type: Object })
    newValue?: Record<string, any>;

    @Prop()
    ipAddress?: string;

    @Prop()
    userAgent?: string;

    @Prop({ default: 'success', enum: ['success', 'failure'] })
    status: 'success' | 'failure';
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ user: 1, createdAt: -1 });
AuditLogSchema.index({ resource: 1, resourceId: 1 });
