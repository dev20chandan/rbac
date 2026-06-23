import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserPermissionDocument = UserPermission & Document;

/**
 * Per-user permission overrides.
 * type: 'allow' grants the permission regardless of role.
 * type: 'deny'  revokes the permission even if role grants it.
 */
@Schema({ timestamps: true, collection: 'user_permissions' })
export class UserPermission {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Permission', required: true })
    permission: Types.ObjectId;

    @Prop({ required: true, enum: ['allow', 'deny'] })
    type: 'allow' | 'deny';
}

export const UserPermissionSchema = SchemaFactory.createForClass(UserPermission);
UserPermissionSchema.index({ user: 1, permission: 1 }, { unique: true });
