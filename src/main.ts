import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Enable CORS
  app.enableCors({
    origin: configService.get<string>('app.corsOrigin'),
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API prefix
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api';
  app.setGlobalPrefix(apiPrefix);

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('TopJob API Documentation')
    .setDescription(
      'API documentation for TopJob - Job Finding Platform\n\n' +
        'Features:\n' +
        '- 🔐 Authentication (Register, Login, Logout, Password Reset)\n' +
        '- 👤 User Management (Candidates & Employers)\n' +
        '- 💼 Job Management\n' +
        '- 📧 Email Verification with OTP\n' +
        '\nBase URL: /api',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
        name: 'Authorization',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication endpoints (Register, Login, Verify, etc.)')
    .addTag('Users', 'User management endpoints')
    .addTag('Jobs', 'Job management endpoints')
    .addTag('Candidates', 'Candidate profile management')
    .addTag('Employers', 'Employer profile management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'TopJob API Docs',
    customfavIcon: 'https://nestjs.com/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .info .title { font-size: 32px; }
    `,
  });

  const port = configService.get<number>('app.port') || 3000;
  await app.listen(port);

  console.log(`
╔════════════════════════════════════════════════════════════╗
║                   TopJob Backend Server                    ║
╠════════════════════════════════════════════════════════════╣
║  🚀 Server:        http://localhost:${port}                    ║
║  📚 API Docs:      http://localhost:${port}/api/docs           ║
║  🔌 API Endpoint:  http://localhost:${port}/${apiPrefix}                ║
╚════════════════════════════════════════════════════════════╝
  `);
}
bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
