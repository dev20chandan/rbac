import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PermissionDocument = Permission & Document;
export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

@Schema({ timestamps: true, collection: 'permissions' })
export class Permission {
    @Prop({ type: Types.ObjectId, ref: 'AppModule', required: true })
    module: Types.ObjectId;

    @Prop({ required: true, enum: ['view', 'create', 'edit', 'delete'] })
    action: PermissionAction;

    @Prop({ required: true, unique: true })
    slug: string; // e.g. "products:view"

    @Prop()
    description?: string;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);
PermissionSchema.index({ module: 1, action: 1 }, { unique: true });
PermissionSchema.index({ slug: 1 }, { unique: true });
