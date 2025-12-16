// src/modules/employers/employers.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmployersController } from './employers.controller';
import { EmployerProfileController } from './employer-profile.controller';
import { EmployersService } from './employers.service';
import {
  Employer,
  EmployerLocation,
  EmployerPendingEdit,
  User,
  Application,
  Job,
} from '../../database/entities';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { LogoutUseCase } from '../auth/usecases';

/**
 * Employers Module
 * Handles employer profile management
 * UC-EMP-01: Hoàn thiện hồ sơ nhà tuyển dụng
 * UC-EMP-02: Cập nhật thông tin công ty
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Employer,
      EmployerLocation,
      EmployerPendingEdit,
      User,
      Application,
      Job,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret') || 'default-secret-key',
        signOptions: {
          expiresIn: Number(configService.get<string>('jwt.expiresIn')),
        },
      }),
    }),
  ],
  controllers: [EmployersController, EmployerProfileController],
  providers: [EmployersService, JwtAuthGuard, RolesGuard, LogoutUseCase],
  exports: [EmployersService],
})
export class EmployersModule {}
