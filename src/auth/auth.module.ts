import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt'; // <-- IMPORT MỚI
import { ConfigModule, ConfigService } from '@nestjs/config'; // <-- IMPORT MỚI

@Module({
  imports: [
    UserModule, // Module User để tìm/tạo user
    ConfigModule, // Module Config để đọc .env

    // Cấu hình Module JWT
    JwtModule.registerAsync({
      imports: [ConfigModule], // Cần ConfigModule
      inject: [ConfigService], // Để tiêm ConfigService
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'), // Lấy secret từ .env
        signOptions: { expiresIn: '1d' }, // Token hết hạn sau 1 ngày
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
