import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { getJwtConfig, jwtConfig } from './jwt.config.js';
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: getJwtConfig,
      inject: [jwtConfig.KEY],
    }),
  ],
  exports: [JwtModule],
})
export class JwtConfigModule {}
