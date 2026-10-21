import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';
import { UsersService } from '../users/users.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

@Injectable()
export class ProfilesService {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  getProfile(userId: number) {
    return this.usersService.findUserById(userId);
  }

  updateProfile(userId: number, dto: UpdateProfileDto) {
    return this.usersService.updateUserProfile(userId, dto);
  }

  async deleteProfile(userId: number) {
    await this.usersService.deleteUserProfile(userId);
    await this.authService.revokeAllSessions(userId);
  }
}
