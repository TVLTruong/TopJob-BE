import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import {
  appConfig,
  databaseConfig,
  jwtConfig,
  mailConfig,
  storageConfig,
} from './config';
// import { AuthModule } from './modules/auth/auth.module';
// import { UsersModule } from './modules/users/users.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { OtpModule } from './modules/otp/otp.module';
import { MailModule } from './modules/mail/mail.module';
import { CandidatesModule } from './modules/candidates/candidates.module';
import { CandidateCvsModule } from './modules/candidate-cvs/candidate-cvs.module';
import { EmployersModule } from './modules/employers/employers.module';
import { EmployerLocationsModule } from './modules/employer-locations/employer-locations.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { SavedJobsModule } from './modules/saved-jobs/saved-jobs.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { StorageModule } from './modules/storage/storage.module';
import { QueueModule } from './modules/queue/queue.module';
import { CacheModule } from './modules/cache/cache.module';
import { LoggerModule } from './modules/logger/logger.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, mailConfig, storageConfig],
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: configService.get('database.entities'),
        migrations: configService.get('database.migrations'),
        migrationsTableName: configService.get('database.migrationsTableName'),
        synchronize: configService.get('database.synchronize'),
        logging: configService.get('database.logging'),
        ssl: configService.get('database.ssl'),
        extra: configService.get('database.extra'),
      }),
    }),

    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('mail.host'),
          port: configService.get<number>('mail.port'),
          secure: false,
          auth: {
            user: configService.get<string>('mail.user'),
            pass: configService.get<string>('mail.password'),
          },
        },
        defaults: {
          from: configService.get<string>('mail.from'),
        },
      }),
    }),

    UsersModule,

    AuthModule,

    OtpModule,

    MailModule,

    CandidatesModule,

    CandidateCvsModule,

    EmployersModule,

    EmployerLocationsModule,

    CategoriesModule,

    CompaniesModule,

    JobsModule,

    ApplicationsModule,

    SavedJobsModule,

    AdminModule,

    NotificationsModule,

    StorageModule,

    QueueModule,

    CacheModule,

    LoggerModule,

    HealthModule,

    // AuthModule,
    // UsersModule,
  ],
})
export class AppModule {}
