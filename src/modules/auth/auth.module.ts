import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt'; // 👈 Import JwtModule
import { PassportModule } from '@nestjs/passport'; // 👈 Import Passport

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

// 🚀 Các file/module mà Auth "cần"
import { UsersModule } from '../users/users.module'; // 👈 Cần để TÌM User
import { CandidatesModule } from '../candidates/candidates.module'; // 👈 Cần để TẠO Candidate
import { EmployersModule } from '../employers/employers.module'; // 👈 Cần để TẠO Employer
import { EmailVerificationToken } from './entities/email-verification-token.entity'; // 👈 Bảng 11
import { PasswordResetToken } from './entities/password-reset-token.entity'; // 👈 Bảng 12

// (Bạn sẽ cần import các file config và strategy)
// import { jwtConfig } from '../../config/jwt.config';
// import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    // 1. Đăng ký 2 Entity Token mới
    TypeOrmModule.forFeature([
      EmailVerificationToken,
      PasswordResetToken,
    ]),
    
    // 2. Import các module "phụ thuộc"
    UsersModule,
    CandidatesModule,
    EmployersModule,

    // 3. Cấu hình JWT (Project của bạn chắc chắn có)
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({ // 👈 Cấu hình TẠM
      secret: 'YOUR_SECRET_KEY_PLEASE_CHANGE_ME', // ‼️ THAY BẰNG .ENV
      signOptions: { expiresIn: '1d' }, // 1 ngày
    }),
    // (Cách tốt hơn là dùng 'JwtModule.registerAsync(jwtConfig)' như nhóm bạn làm)
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    // JwtStrategy, // 👈 (Bạn sẽ cần thêm file này)
  ],
  exports: [AuthService],
})
export class AuthModule {}