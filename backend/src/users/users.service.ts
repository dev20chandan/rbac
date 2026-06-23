import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';
import { Role, RoleDocument } from '../roles/schemas/role.schema';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
        private auditLogsService: AuditLogsService,
    ) { }

    async create(dto: CreateUserDto, actorId?: Types.ObjectId) {
        const existing = await this.userModel.findOne({ email: dto.email.toLowerCase(), isDeleted: false });
        if (existing) throw new ConflictException('Email already in use');

        const hashedPassword = await bcrypt.hash(dto.password, 12);
        const user = await this.userModel.create({
            ...dto,
            email: dto.email.toLowerCase(),
            password: hashedPassword,
        });

        if (actorId) {
            await this.auditLogsService.log({
                userId: actorId,
                action: 'CREATE',
                resource: 'User',
                resourceId: user._id as Types.ObjectId,
                newValue: { email: user.email },
                status: 'success',
            });
        }

        return user;
    }

    async findAll(page = 1, limit = 20, search?: string) {
        const superAdminRoles = await this.roleModel.find({ isSuperAdmin: true }).select('_id').lean();
        const superAdminIds = superAdminRoles.map(r => r._id);

        const query: any = { isDeleted: false, role: { $nin: superAdminIds } };
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const [users, total] = await Promise.all([
            this.userModel
                .find(query)
                .populate('role', 'name slug')
                .select('-password -refreshToken')
                .skip((page - 1) * limit)
                .limit(limit)
                .sort({ createdAt: -1 })
                .lean(),
            this.userModel.countDocuments(query),
        ]);

        return {
            users,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        };
    }

    async findOne(id: string) {
        const user = await this.userModel
            .findOne({ _id: id, isDeleted: false })
            .populate('role', 'name slug isSuperAdmin')
            .select('-password -refreshToken')
            .lean();
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async update(id: string, dto: UpdateUserDto, actorId?: Types.ObjectId) {
        const user = await this.userModel.findOne({ _id: id, isDeleted: false }).lean();
        if (!user) throw new NotFoundException('User not found');

        const updateData: Partial<User> = { ...dto } as any;
        if (dto.password) {
            updateData.password = await bcrypt.hash(dto.password, 12);
        }
        if (dto.email) {
            updateData.email = dto.email.toLowerCase();
        }

        const updated = await this.userModel
            .findByIdAndUpdate(id, updateData, { new: true })
            .populate('role', 'name slug')
            .select('-password -refreshToken')
            .lean();

        if (actorId) {
            await this.auditLogsService.log({
                userId: actorId,
                action: 'UPDATE',
                resource: 'User',
                resourceId: new Types.ObjectId(id),
                oldValue: { email: user.email },
                newValue: { email: dto.email || user.email },
                status: 'success',
            });
        }

        return updated;
    }

    async remove(id: string, actorId?: Types.ObjectId) {
        const user = await this.userModel.findOne({ _id: id, isDeleted: false });
        if (!user) throw new NotFoundException('User not found');

        await this.userModel.findByIdAndUpdate(id, { isDeleted: true, isActive: false });

        if (actorId) {
            await this.auditLogsService.log({
                userId: actorId,
                action: 'DELETE',
                resource: 'User',
                resourceId: new Types.ObjectId(id),
                status: 'success',
            });
        }

        return { message: 'User deleted successfully' };
    }
}
