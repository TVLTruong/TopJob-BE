import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { getMailerConfig } from './config/mailer.config';
import { getTypeOrmConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getTypeOrmConfig,
    }),

    // Sửa MailerModule
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const config = getMailerConfig(configService);

        // DEBUG: In ra để kiểm tra
        console.log('=== MAILER CONFIG DEBUG ===');
        console.log('SMTP HOST:', config.transport.host);
        console.log('SMTP PORT:', config.transport.port);
        console.log('SMTP USER:', config.transport.auth.user);
        console.log(
          'SMTP PASS:',
          config.transport.auth.pass ? '***' : 'MISSING',
        );
        console.log('==========================');

        return config;
      },
    }),

    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
