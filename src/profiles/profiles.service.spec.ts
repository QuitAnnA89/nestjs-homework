import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { AuthService } from '../auth/auth.service.js';
import { UsersService } from '../users/users.service.js';
import { ProfilesService } from './profiles.service.js';

describe('ProfilesService', () => {
  const manager = {};
  let service: ProfilesService;
  let usersService: { deleteUserProfile: Mock; findUserById: Mock };
  let authService: { revokeAllSessions: Mock };

  beforeEach(async () => {
    usersService = { deleteUserProfile: vi.fn(), findUserById: vi.fn() };
    authService = { revokeAllSessions: vi.fn() };
    const dataSource = {
      transaction: vi.fn((cb: (m: object) => unknown) => cb(manager)),
    };
    const module = await Test.createTestingModule({
      providers: [
        ProfilesService,
        { provide: UsersService, useValue: usersService },
        { provide: AuthService, useValue: authService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = module.get(ProfilesService);
  });

  describe('deleteProfile', () => {
    it('удаляет профиль и отзывает все сессии', async () => {
      await service.deleteProfile(999);
      expect(usersService.deleteUserProfile).toHaveBeenCalledWith(999, manager);
      expect(authService.revokeAllSessions).toHaveBeenCalledWith(999, manager);
    });
  });

  describe('getProfile', () => {
    it('бросает 401, если пользователь не найден', async () => {
      usersService.findUserById.mockRejectedValue(new NotFoundException());
      await expect(service.getProfile(999)).rejects.toThrow(
        UnauthorizedException,
      );
    });
    it('пробрасывает другие ошибки как есть', async () => {
      usersService.findUserById.mockRejectedValue(new Error('db down'));
      await expect(service.getProfile(999)).rejects.toThrow('db down');
    });
  });
});
