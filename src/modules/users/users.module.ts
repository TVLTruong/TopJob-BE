// src/modules/users/users.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, Candidate, Employer } from '../../database/entities';
import { JwtAuthGuard } from '../../common/guards';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
/**
 * Users Module
 * Handles user management
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Candidate, Employer]),
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
    AuthModule,
    StorageModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, JwtAuthGuard],
  exports: [UsersService],
})
export class UsersModule {}
