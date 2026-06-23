import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true, collection: 'users' })
export class User {
    @Prop({ required: true, trim: true })
    firstName: string;

    @Prop({ required: true, trim: true })
    lastName: string;

    @Prop({ required: true, unique: true, lowercase: true, trim: true })
    email: string;

    @Prop({ required: true, select: false })
    password: string;

    @Prop({ type: Types.ObjectId, ref: 'Role', required: true })
    role: Types.ObjectId;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ default: false })
    isDeleted: boolean;

    @Prop({ type: String, select: false, nullable: true })
    refreshToken?: string;

    @Prop()
    lastLogin?: Date;

    @Prop()
    avatar?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Soft delete index
UserSchema.index({ isDeleted: 1 });
UserSchema.index({ email: 1 });
