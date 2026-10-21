import { ValidationPipe } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';
import { appConfig } from './configs/app.config.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('Регистрация, JWT-аутентификация и CRUD пользователей')
    .setDescription(
      'REST API на NestJS: регистрация и вход по логину и паролю, JWT access/refresh-токены с ротацией, управление своим профилем и список пользователей с пагинацией.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
  const { port } = app.get<ConfigType<typeof appConfig>>(appConfig.KEY);
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(port);
}
await bootstrap();
