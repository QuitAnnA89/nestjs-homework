import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuthService } from '../auth/auth.service.js';
import { UsersService } from '../users/users.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

@Injectable()
export class ProfilesService {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly dataSource: DataSource,
  ) {}

  getProfile(userId: number) {
    return this.usersService.findUserById(userId);
  }

  updateProfile(userId: number, dto: UpdateProfileDto) {
    return this.usersService.updateUserProfile(userId, dto);
  }

  async deleteProfile(userId: number) {
    await this.dataSource.transaction(async (manager) => {
      await this.usersService.deleteUserProfile(userId, manager);
      await this.authService.revokeAllSessions(userId, manager);
    });
  }
}
