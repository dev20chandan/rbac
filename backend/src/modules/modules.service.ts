import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppModule, AppModuleDocument } from './schemas/module.schema';
import { Permission, PermissionDocument } from '../permissions/schemas/permission.schema';
import { CreateModuleDto, UpdateModuleDto } from './dto/module.dto';

const PERMISSION_ACTIONS = ['view', 'create', 'edit', 'delete'] as const;

@Injectable()
export class ModulesService {
    constructor(
        @InjectModel(AppModule.name) private moduleModel: Model<AppModuleDocument>,
        @InjectModel(Permission.name) private permissionModel: Model<PermissionDocument>,
    ) { }

    async create(dto: CreateModuleDto) {
        const existing = await this.moduleModel.findOne({ slug: dto.slug.toLowerCase(), isDeleted: false });
        if (existing) throw new ConflictException('Module slug already exists');

        const module = await this.moduleModel.create({
            ...dto,
            slug: dto.slug.toLowerCase(),
            parent: dto.parent ? new Types.ObjectId(dto.parent) : null,
        });

        // Auto-generate 4 permissions for this module
        await this.generatePermissions(module._id as Types.ObjectId, module.slug);

        return module;
    }

    async findAll() {
        return this.moduleModel
            .find({ isDeleted: false })
            .sort({ sortOrder: 1 })
            .lean();
    }

    async findOne(id: string) {
        const module = await this.moduleModel.findOne({ _id: id, isDeleted: false }).lean();
        if (!module) throw new NotFoundException('Module not found');
        return module;
    }

    async update(id: string, dto: UpdateModuleDto) {
        const module = await this.moduleModel.findOne({ _id: id, isDeleted: false });
        if (!module) throw new NotFoundException('Module not found');

        const updateData: any = { ...dto };
        if (dto.parent) updateData.parent = new Types.ObjectId(dto.parent);

        return this.moduleModel.findByIdAndUpdate(id, updateData, { new: true }).lean();
    }

    async remove(id: string) {
        const module = await this.moduleModel.findOne({ _id: id, isDeleted: false });
        if (!module) throw new NotFoundException('Module not found');

        await this.moduleModel.findByIdAndUpdate(id, { isDeleted: true });
        return { message: 'Module deleted' };
    }

    private async generatePermissions(moduleId: Types.ObjectId, slug: string) {
        const docs = PERMISSION_ACTIONS.map(action => ({
            module: moduleId,
            action,
            slug: `${slug}:${action}`,
            description: `${action} permission for ${slug}`,
        }));

        // Upsert to avoid duplicates
        await Promise.all(
            docs.map(doc =>
                this.permissionModel.findOneAndUpdate(
                    { slug: doc.slug },
                    doc,
                    { upsert: true, new: true },
                ),
            ),
        );
    }
}
