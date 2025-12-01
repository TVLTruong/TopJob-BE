// src/modules/candidates/candidates.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';
import { Candidate, CandidateCv, User } from '../../database/entities';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';

/**
 * Candidates Module
 * Handles candidate profile management
 * UC-CAN-01: Hoàn thiện hồ sơ ứng viên
 * UC-CAN-02: Upload CV
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Candidate, CandidateCv, User]),
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
  controllers: [CandidatesController],
  providers: [CandidatesService, JwtAuthGuard, RolesGuard],
  exports: [CandidatesService],
})
export class CandidatesModule {}
