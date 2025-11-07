import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { Employer } from '../employers/entities/employer.entity';
import { EmployerLocation } from '../employers/entities/employer-location.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { OtpVerification } from './entities/otp-verification.entity';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Candidate,
      Employer,
      EmployerLocation,
      OtpVerification,
    ]),
    MailerModule, // Đã cấu hình ở app.module
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
