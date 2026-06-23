import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User, UserSchema } from '../users/schemas/user.schema';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
    imports: [
        PassportModule,
        JwtModule.register({}), // Secrets passed dynamically in service
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        AuditLogsModule,
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    exports: [AuthService, JwtModule],
})
export class AuthModule { }
