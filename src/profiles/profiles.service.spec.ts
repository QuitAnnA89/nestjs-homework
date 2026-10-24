import { describe, expect, it, vi } from 'vitest';
import { ProfilesService } from './profiles.service.js';

describe('ProfilesService', () => {
  describe('deleteProfile', () => {
    it('удаляет профиль и отзывает все сессии', async () => {
      const manager = {};
      const dataSource = {
        transaction: vi.fn((cb) => cb(manager)),
      };
      const usersService = {
        deleteUserProfile: vi.fn(),
      };
      const authService = {
        revokeAllSessions: vi.fn(),
      };
      const service = new ProfilesService(
        usersService as any,
        authService as any,
        dataSource as any,
      );
      await service.deleteProfile(999);
      expect(usersService.deleteUserProfile).toHaveBeenCalledWith(999, manager);
      expect(authService.revokeAllSessions).toHaveBeenCalledWith(999, manager);
    });
  });
});
