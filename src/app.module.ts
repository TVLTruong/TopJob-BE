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
import { AdminEmployerApprovalModule } from './modules/admin-employer-approval/admin-employer-approval.module';
import { AdminJobApprovalModule } from './modules/admin-job-approval/admin-job-approval.module';
import { AdminEmployerManagementModule } from './modules/admin-employer-management/admin-employer-management.module';
import { AdminCandidateManagementModule } from './modules/admin-candidate-management/admin-candidate-management.module';
import { AdminJobManagementModule } from './modules/admin-job-management/admin-job-management.module';
import { AdminCategoryModule } from './modules/admin-category/admin-category.module';
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
      useFactory: (configService: ConfigService) => {
        // Lấy cấu hình mail với kiểu rõ ràng
        const mailHost = configService.get<string>('mail.host');
        const mailPort = configService.get<number>('mail.port') || 587;
        const mailUser = configService.get<string>('mail.user');
        const mailPass = configService.get<string>('mail.password');
        const mailFrom =
          configService.get<string>('mail.from') || 'noreply@topjob.com';

        // Debug cấu hình
        console.log({
          MAIL_HOST: mailHost,
          MAIL_USER: mailUser,
          MAIL_PASS: mailPass ? 'Loaded' : 'Missing',
          MAIL_FROM: mailFrom,
        });

        return {
          transport: {
            host: mailHost,
            port: mailPort,
            secure: false, // false cho port 587
            auth: {
              user: mailUser,
              pass: mailPass,
            },
          },
          defaults: {
            from: mailFrom,
          },
        };
      },
    }),

    AuthModule,

    UsersModule,

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

    AdminEmployerApprovalModule,

    AdminJobApprovalModule,

    AdminEmployerManagementModule,

    AdminCandidateManagementModule,

    AdminJobManagementModule,

    AdminCategoryModule,

    NotificationsModule,

    StorageModule,

    QueueModule,

    CacheModule,

    LoggerModule,

    HealthModule,
  ],
})
export class AppModule {}
