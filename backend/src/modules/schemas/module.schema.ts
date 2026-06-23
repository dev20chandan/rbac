import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AppModuleDocument = AppModule & Document;

export enum ModuleIcon {
    DASHBOARD = 'LayoutDashboard',
    USERS = 'Users',
    CATEGORIES = 'Tag',
    SUBCATEGORIES = 'Tags',
    PRODUCTS = 'Package',
    ORDERS = 'ShoppingCart',
    PAYMENTS = 'CreditCard',
    FAQ = 'HelpCircle',
    PAGES = 'FileText',
    SETTINGS = 'Settings',
    DEFAULT = 'Circle',
}

@Schema({ timestamps: true, collection: 'modules' })
export class AppModule {
    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ required: true, unique: true, lowercase: true, trim: true })
    slug: string;

    @Prop({ required: true, trim: true })
    route: string;

    @Prop({ default: ModuleIcon.DEFAULT })
    icon: string;

    @Prop({ type: Types.ObjectId, ref: 'AppModule', default: null })
    parent: Types.ObjectId | null;

    @Prop({ default: 0 })
    sortOrder: number;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ default: false })
    isDeleted: boolean;
}

export const AppModuleSchema = SchemaFactory.createForClass(AppModule);
AppModuleSchema.index({ slug: 1 });
AppModuleSchema.index({ parent: 1, sortOrder: 1 });
