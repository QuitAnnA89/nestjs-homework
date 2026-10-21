import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { appConfig } from './configs/app.config.js';
import { databaseConfig, getTypeOrmConfig } from './configs/database.config.js';
import { envSchema } from './configs/env.validation.js';
import { jwtConfig } from './configs/jwt.config.js';
import { ProfilesModule } from './profiles/profiles.module.js';
import { UsersModule } from './users/users.module.js';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => envSchema.parse(config),
      load: [jwtConfig, databaseConfig, appConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getTypeOrmConfig,
      inject: [databaseConfig.KEY],
    }),
    UsersModule,
    AuthModule,
    ProfilesModule,
  ],
  controllers: [],
  providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }],
})
export class AppModule {}
