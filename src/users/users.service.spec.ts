import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { describe, it, vi } from 'vitest';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  describe('findUserById', () => {
    it('возвращает пользователя, если он найден', async () => {
      const user = {
        id: 1,
        login: 'user',
        email: 'user@test.com',
        age: 25,
        description: null,
      };
      const usersRepository = {
        findUserById: vi.fn().mockResolvedValue(user),
      };
      const service = new UsersService(usersRepository as any);
      const result = await service.findUserById(user.id);
      expect(result).toEqual(user);
    });

    it('бросает 401, если пользователь не найден', async () => {
      const usersRepository = {
        findUserById: vi.fn().mockResolvedValue(null),
      };
      const service = new UsersService(usersRepository as any);
      await expect(service.findUserById(999)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
  describe('deleteUserProfile', () => {
    it('удаляет пользователя', async () => {
      const usersRepository = {
        softDeleteUser: vi.fn().mockResolvedValue({ affected: 1 }),
      };
      const service = new UsersService(usersRepository as any);
      const result = await service.deleteUserProfile(999);

      expect(result).toEqual({ affected: 1 });
      expect(usersRepository.softDeleteUser).toHaveBeenCalledWith(999);
    });
    it('бросает 401, если пользователь не найден', async () => {
      const usersRepository = {
        softDeleteUser: vi.fn().mockResolvedValue({ affected: 0 }),
      };
      const service = new UsersService(usersRepository as any);

      await expect(service.deleteUserProfile(999)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
  describe('updateUserProfile', () => {
    it('обновляет пользователя', async () => {
      const user = {
        id: 1,
        login: 'user',
        email: 'user@test.com',
        age: 25,
        description: null,
      };
      const dto = {
        login: 'user',
        email: 'user@mail.com',
        age: 13,
        description: 'bla',
      };
      const usersRepository = {
        findUserById: vi.fn().mockResolvedValue(user),
        updateUser: vi.fn().mockResolvedValue({ affected: 1 }),
      };
      const service = new UsersService(usersRepository as any);
      const result = await service.updateUserProfile(user.id, dto);
      expect(result).toEqual(user);
      expect(usersRepository.updateUser).toHaveBeenCalledWith(user.id, dto);
    });
    it('бросает 400 ошибку, если пришло пустой dto', async () => {
      const dto = {};
      const usersRepository = {
        updateUser: vi.fn(),
      };
      const service = new UsersService(usersRepository as any);
      await expect(service.updateUserProfile(999, dto)).rejects.toThrow(
        BadRequestException,
      );
      expect(usersRepository.updateUser).not.toHaveBeenCalled();
    });
    it('бросает 401 ошибку, если пользователь не авторизирован', async () => {
      const dto = {
        login: 'user',
        email: 'user@mail.com',
        age: 13,
        description: 'bla',
      };
      const usersRepository = {
        updateUser: vi.fn().mockResolvedValue({ affected: 0 }),
      };
      const service = new UsersService(usersRepository as any);
      await expect(service.updateUserProfile(999, dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
