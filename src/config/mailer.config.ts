import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

export const getMailerConfig = (configService: ConfigService) => ({
  transport: {
    host: configService.get<string>('SMTP_HOST'),
    port: configService.get<number>('SMTP_PORT') || 587,
    secure: false, // false cho port 587
    auth: {
      user: configService.get<string>('SMTP_USER'),
      pass: configService.get<string>('SMTP_PASS'),
    },
  },
  defaults: {
    from: `"TopJob" <${configService.get('SMTP_FROM')}>`,
  },
  template: {
    dir: join(__dirname, '..', 'templates'),
    adapter: new HandlebarsAdapter(),
    options: {
      strict: true,
    },
  },
});
