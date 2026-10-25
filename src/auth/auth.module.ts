import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtConfigModule } from '../configs/jwt.config.module.js';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { RefreshTokenEntity } from './entities/refresh-token.entity.js';
import { RefreshTokensRepository } from './refresh-tokens.repository.js';

@Module({
  exports: [AuthService],
  imports: [
    TypeOrmModule.forFeature([RefreshTokenEntity]),
    JwtConfigModule,
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, RefreshTokensRepository],
})
export class AuthModule {}
