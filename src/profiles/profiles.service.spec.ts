import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';
import { AuthService } from '../auth/auth.service.js';
import { UsersService } from '../users/users.service.js';
import { ProfilesService } from './profiles.service.js';
describe('ProfilesService', () => {
  describe('deleteProfile', () => {
    it('удаляет профиль и отзывает все сессии', async () => {
      const manager = {};
      const dataSource = {
        transaction: vi.fn((cb) => cb(manager)),
      };
      const usersService = { deleteUserProfile: vi.fn() };
      const authService = { revokeAllSessions: vi.fn() };
      const module = await Test.createTestingModule({
        providers: [
          ProfilesService,
          { provide: UsersService, useValue: usersService },
          { provide: AuthService, useValue: authService },
          { provide: DataSource, useValue: dataSource },
        ],
      }).compile();
      const service = module.get(ProfilesService);
      await service.deleteProfile(999);
      expect(usersService.deleteUserProfile).toHaveBeenCalledWith(999, manager);
      expect(authService.revokeAllSessions).toHaveBeenCalledWith(999, manager);
    });
  });
});
