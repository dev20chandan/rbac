import {
    Injectable,
    UnauthorizedException,
    BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { User, UserDocument } from '../users/schemas/user.schema';
import { LoginDto } from './dto/login.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private jwtService: JwtService,
        private configService: ConfigService,
        private auditLogsService: AuditLogsService,
    ) { }

    async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
        const { email, password } = loginDto;

        const user = await this.userModel
            .findOne({ email: email.toLowerCase(), isDeleted: false })
            .select('+password')
            .populate('role')
            .lean();

        if (!user) throw new UnauthorizedException('Invalid credentials');
        if (!user.isActive) throw new UnauthorizedException('Account is deactivated');

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

        const tokens = await this.generateTokens(user._id as Types.ObjectId, user.email);

        // Store hashed refresh token
        const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
        await this.userModel.findByIdAndUpdate(user._id, {
            refreshToken: hashedRefreshToken,
            lastLogin: new Date(),
        });

        await this.auditLogsService.log({
            userId: user._id as Types.ObjectId,
            action: 'LOGIN',
            resource: 'User',
            resourceId: user._id as Types.ObjectId,
            ipAddress,
            userAgent,
            status: 'success',
        });

        const { password: _, refreshToken: __, ...safeUser } = user;
        return { user: safeUser, ...tokens };
    }

    async refreshTokens(userId: string, refreshToken: string) {
        const user = await this.userModel
            .findOne({ _id: userId, isDeleted: false, isActive: true })
            .select('+refreshToken')
            .lean();

        if (!user || !user.refreshToken)
            throw new UnauthorizedException('Refresh token invalid');

        const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
        if (!isValid) throw new UnauthorizedException('Refresh token invalid');

        const tokens = await this.generateTokens(user._id as Types.ObjectId, user.email);

        // Rotate refresh token
        const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
        await this.userModel.findByIdAndUpdate(user._id, { refreshToken: hashedRefreshToken });

        return tokens;
    }

    async logout(userId: string, ipAddress?: string) {
        await this.userModel.findByIdAndUpdate(userId, { refreshToken: null });

        await this.auditLogsService.log({
            userId: new Types.ObjectId(userId),
            action: 'LOGOUT',
            resource: 'User',
            resourceId: new Types.ObjectId(userId),
            ipAddress,
            status: 'success',
        });

        return { message: 'Logged out successfully' };
    }

    async getMe(userId: string) {
        const user = await this.userModel
            .findById(userId)
            .populate('role', 'name slug isSuperAdmin')
            .select('-password -refreshToken')
            .lean();

        if (!user) throw new UnauthorizedException('User not found');
        return user;
    }

    private async generateTokens(userId: Types.ObjectId, email: string) {
        const payload = { sub: userId.toString(), email };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
                expiresIn: (this.configService.get('JWT_ACCESS_EXPIRES_IN') || '15m') as any,
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
                expiresIn: (this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d') as any,
            }),
        ]);

        return { accessToken, refreshToken };
    }
}
 
