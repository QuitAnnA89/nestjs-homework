import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { UsersRepository } from './users.repository.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: {
    findUserById: Mock;
    softDeleteUser: Mock;
    updateUser: Mock;
  };

  beforeEach(async () => {
    usersRepository = {
      findUserById: vi.fn(),
      softDeleteUser: vi.fn(),
      updateUser: vi.fn(),
    };
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: usersRepository },
      ],
    }).compile();
    service = module.get(UsersService);
  });

  describe('findUserById', () => {
    it('возвращает пользователя, если он найден', async () => {
      const user = {
        id: 1,
        login: 'user',
        email: 'user@test.com',
        age: 25,
        description: null,
      };
      usersRepository.findUserById.mockResolvedValue(user);
      const result = await service.findUserById(user.id);
      expect(result).toEqual(user);
    });

    it('бросает 404, если пользователь не найден', async () => {
      usersRepository.findUserById.mockResolvedValue(null);
      await expect(service.findUserById(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
  describe('deleteUserProfile', () => {
    it('удаляет пользователя', async () => {
      usersRepository.softDeleteUser.mockResolvedValue({ affected: 1 });
      const result = await service.deleteUserProfile(999);

      expect(result).toEqual({ affected: 1 });
      expect(usersRepository.softDeleteUser).toHaveBeenCalledWith(
        999,
        undefined,
      );
    });
    it('бросает 404, если пользователь не найден', async () => {
      usersRepository.softDeleteUser.mockResolvedValue({ affected: 0 });

      await expect(service.deleteUserProfile(999)).rejects.toThrow(
        NotFoundException,
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
      usersRepository.findUserById.mockResolvedValue(user);
      usersRepository.updateUser.mockResolvedValue({ affected: 1 });
      const result = await service.updateUserProfile(user.id, dto);
      expect(result).toEqual(user);
      expect(usersRepository.updateUser).toHaveBeenCalledWith(user.id, dto);
    });
    it('бросает 400 ошибку, если пришло пустой dto', async () => {
      const dto = {};
      await expect(service.updateUserProfile(999, dto)).rejects.toThrow(
        BadRequestException,
      );
      expect(usersRepository.updateUser).not.toHaveBeenCalled();
    });
    it('бросает 404 ошибку, если пользователь не найден', async () => {
      const dto = {
        login: 'user',
        email: 'user@mail.com',
        age: 13,
        description: 'bla',
      };
      usersRepository.updateUser.mockResolvedValue({ affected: 0 });
      await expect(service.updateUserProfile(999, dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
