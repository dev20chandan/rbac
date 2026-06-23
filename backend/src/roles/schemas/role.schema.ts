import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RoleDocument = Role & Document;

@Schema({ timestamps: true, collection: 'roles' })
export class Role {
    @Prop({ required: true, unique: true, trim: true })
    name: string;

    @Prop({ required: true, unique: true, lowercase: true, trim: true })
    slug: string;

    @Prop()
    description?: string;

    @Prop({ default: false })
    isSuperAdmin: boolean;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ default: false })
    isDeleted: boolean;

    @Prop({ default: 0 })
    hierarchy: number; // Lower = higher privilege
}

export const RoleSchema = SchemaFactory.createForClass(Role);
RoleSchema.index({ slug: 1, isDeleted: 1 });
