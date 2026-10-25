import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { JwtConfigModule } from '../configs/jwt.config.module.js';
import { UsersModule } from '../users/users.module.js';
import { ProfilesController } from './profiles.controller.js';
import { ProfilesService } from './profiles.service.js';

@Module({
  imports: [UsersModule, JwtConfigModule, AuthModule],
  controllers: [ProfilesController],
  providers: [ProfilesService],
})
export class ProfilesModule {}
