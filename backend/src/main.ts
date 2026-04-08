import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import { static as serveStatic } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  const uploadsDir = process.env.UPLOADS_DIR || join(process.cwd(), 'uploads');
  app.use('/uploads', serveStatic(uploadsDir));

  app.enableCors({
    origin: true,
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 4000);
}

void bootstrap();
