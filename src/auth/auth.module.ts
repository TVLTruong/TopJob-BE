// src/auth/auth.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import {
  RegisterCandidateUseCase,
  RegisterEmployerUseCase,
  VerifyEmailUseCase,
  LoginUseCase,
  LogoutUseCase,
  ForgotPasswordUseCase,
} from './usecases';
import { EmailService, OtpService, JwtAuthService } from './services';
import {
  User,
  Candidate,
  Employer,
  OtpVerification,
} from '../database/entities';

/**
 * Auth Module
 * Handles authentication and registration
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Candidate, Employer, OtpVerification]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret') || 'default-secret-key',
        signOptions: {
          expiresIn: '1h',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    // Services
    EmailService,
    OtpService,
    JwtAuthService,

    // Use Cases
    RegisterCandidateUseCase,
    RegisterEmployerUseCase,
    VerifyEmailUseCase,
    LoginUseCase,
    LogoutUseCase,
    ForgotPasswordUseCase,
  ],
  exports: [EmailService, OtpService, JwtAuthService],
})
export class AuthModule {}
