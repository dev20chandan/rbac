import {
    Controller,
    Post,
    Get,
    Body,
    Req,
    Res,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
    constructor(
        private authService: AuthService,
        private configService: ConfigService,
    ) { }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(
        @Body() loginDto: LoginDto,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const ipAddress = req.ip;
        const userAgent = req.headers['user-agent'];
        const result = await this.authService.login(loginDto, ipAddress, userAgent);

        // Set HTTP-only refresh token cookie
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: this.configService.get('NODE_ENV') === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return {
            message: 'Login successful',
            data: { user: result.user, accessToken: result.accessToken },
        };
    }

    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refreshTokens(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const refreshToken = req.cookies?.['refreshToken'];
        const userId = req.cookies?.['userId'] || req.body?.userId;

        if (!refreshToken || !userId) {
            return { message: 'Refresh token missing', data: null };
        }

        const tokens = await this.authService.refreshTokens(userId, refreshToken);

        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: this.configService.get('NODE_ENV') === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return { message: 'Tokens refreshed', data: { accessToken: tokens.accessToken } };
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(
        @CurrentUser() user: any,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        res.clearCookie('refreshToken');
        const result = await this.authService.logout(user._id.toString(), req.ip);
        return { message: result.message, data: null };
    }

    @Get('me')
    async getMe(@CurrentUser() user: any) {
        const fullUser = await this.authService.getMe(user._id.toString());
        return { message: 'Profile fetched', data: fullUser };
    }
}
