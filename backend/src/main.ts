import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
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

  const swaggerConfig = new DocumentBuilder()
    .setTitle('mini-app-spo API')
    .setDescription(
      'REST API мини-приложения. Защищённые маршруты требуют cookie `spo_session` (JWT). ' +
        'Получите её через POST /api/auth/vk, затем в Swagger нажмите **Authorize** и вставьте значение cookie, ' +
        'или выполняйте запросы из того же браузера после логина. ' +
        'Дополнительно: **GraphQL** на `POST /graphql` (чтение каталога/событий/ачивок без дублирования бизнес-логики).',
    )
    .setVersion('1.0')
    .addCookieAuth('spo_session', {
      type: 'apiKey',
      in: 'cookie',
      name: 'spo_session',
    })
    .addTag('health', 'Проверка сервиса')
    .addTag('auth', 'Сессия VK')
    .addTag('users', 'Пользователи')
    .addTag('shop', 'Магазин и покупки')
    .addTag('cat', 'Кот Олег (экипировка)')
    .addTag('events', 'События')
    .addTag('achievements', 'Достижения')
    .addTag('upload', 'Загрузка файлов')
    .addTag('badges', 'Значки на орбите')
    .addTag('notifications', 'Уведомления')
    .addTag('resources', 'Ресурсы: касса и материалы')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      requestInterceptor: (req: { credentials?: string }) => {
        req.credentials = 'include';
        return req;
      },
    },
    customSiteTitle: 'spo API docs',
  });

  await app.listen(process.env.PORT ?? 4000);
}

void bootstrap();
