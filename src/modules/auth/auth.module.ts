import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config'; // 👈 Import Config

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy'; // 👈 Import Strategy

// Các file/module mà Auth "cần"
import { UsersModule } from '../users/users.module';
import { CandidatesModule } from '../candidates/candidates.module';
import { EmployersModule } from '../employers/employers.module';
import { EmailVerificationToken } from './entities/email-verification-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';

@Module({
  imports: [
    // 1. Đăng ký 2 Entity Token (Bảng 11, 12)
    TypeOrmModule.forFeature([
      EmailVerificationToken,
      PasswordResetToken,
    ]),

    // 2. Import các module "phụ thuộc"
    UsersModule,
    CandidatesModule,
    EmployersModule,

    // 3. Cấu hình JWT
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule], // Cần ConfigModule để đọc .env
      inject: [ConfigService],
      
      // --- 🚀 ĐÂY LÀ CHỖ SỬA LỖI ---
      useFactory: (configService: ConfigService) => {
        
        // 1. Sửa Lỗi 1 (Secret): Dùng 'getOrThrow'
        // Đảm bảo 'secret' luôn là 'string', không bao giờ 'undefined'
        const secret = configService.getOrThrow<string>('JWT_SECRET');

        // 2. Sửa Lỗi 2 (ExpiresIn): Dùng 'get' (không ép kiểu <string>)
        // Đọc đúng tên biến 'JWT_EXPIRATION' từ file .env của bạn
        const expiresIn = configService.get('JWT_EXPIRATION', '7d');

        return {
          secret: secret,
          signOptions: {
            expiresIn: expiresIn, // 👈 Lỗi sẽ hết ở đây
          },
        };
      },
      // --- HẾT PHẦN SỬA LỖI ---
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy, // 👈 Đăng ký Strategy
  ],
  exports: [AuthService],
})
export class AuthModule {}