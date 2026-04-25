import { INestApplication, ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import {
  getUploadsRootPath,
  getUploadsUrlPrefix,
} from './uploads/uploads.config';

export function configureApp(app: INestApplication): void {
  const expressApp = app as NestExpressApplication;
  const frontendUrls = (process.env.FRONTEND_URL ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.setGlobalPrefix('api');
  expressApp.useStaticAssets(getUploadsRootPath(), {
    prefix: `${getUploadsUrlPrefix()}/`,
  });
  app.enableCors({
    origin: frontendUrls,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
}
