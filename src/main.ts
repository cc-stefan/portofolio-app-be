import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './setup-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  const host = process.env.APP_HOST ?? '0.0.0.0';

  await app.listen(port, host);
}

void bootstrap();
