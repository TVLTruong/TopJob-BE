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
import { AuthModule } from './auth/auth.module';
// import { UsersModule } from './modules/users/users.module';

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

    // MailerModule.forRootAsync({
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: (configService: ConfigService) => ({
    //     transport: {
    //       host: configService.get<string>('mail.host'),
    //       port: configService.get<number>('mail.port'),
    //       secure: false,
    //       auth: {
    //         user: configService.get<string>('mail.user'),
    //         pass: configService.get<string>('mail.password'),
    //       },
    //     },
    //     defaults: {
    //       from: configService.get<string>('mail.from'),
    //     },
    //   }),
    // }),

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
    // UsersModule,
  ],
})
export class AppModule {}
