import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { hash, verify } from 'argon2';
import type { Response } from 'express';
import { createHash } from 'node:crypto';
import { DataSource } from 'typeorm';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { jwtConfig } from '../configs/jwt.config.js';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';
import { RefreshTokensRepository } from './refresh-tokens.repository.js';

vi.mock('argon2');
describe('AuthService', () => {
  const manager = {};
  const jwt = {
    accessSecret: 'a',
    refreshSecret: 'r',
    accessTtl: 900,
    refreshTtl: 604800,
  };

  let service: AuthService;
  let usersService: {
    findUserByLoginWithPassword: Mock;
    findUserByEmail: Mock;
    findUserByLogin: Mock;
    createUser: Mock;
  };
  let jwtService: { sign: Mock; verify: Mock };
  let refreshTokensRepository: {
    findTokenById: Mock;
    deleteTokenById: Mock;
    deleteAllTokensByUserId: Mock;
    saveToken: Mock;
  };
  let dataSource: { transaction: Mock };
  let res: { cookie: Mock; clearCookie: Mock };

  beforeEach(async () => {
    usersService = {
      findUserByLoginWithPassword: vi.fn(),
      findUserByEmail: vi.fn(),
      findUserByLogin: vi.fn(),
      createUser: vi.fn(),
    };
    jwtService = { sign: vi.fn(), verify: vi.fn() };
    refreshTokensRepository = {
      findTokenById: vi.fn(),
      deleteTokenById: vi.fn(),
      deleteAllTokensByUserId: vi.fn(),
      saveToken: vi.fn(),
    };
    dataSource = {
      transaction: vi.fn((cb: (m: object) => unknown) => cb(manager)),
    };
    res = { cookie: vi.fn(), clearCookie: vi.fn() };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: jwtConfig.KEY, useValue: jwt },
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: RefreshTokensRepository, useValue: refreshTokensRepository },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  const asResponse = () => res as unknown as Response;

  describe('signIn', () => {
    it('бросает 401, если пользователь не найден', async () => {
      usersService.findUserByLoginWithPassword.mockResolvedValue(null);
      const dto = { login: 'user', password: '123456' };
      await expect(service.signIn(asResponse(), dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
    it('бросает 401, если неверный пароль', async () => {
      const user = { id: 1, passwordHash: 'hash' };
      usersService.findUserByLoginWithPassword.mockResolvedValue(user);
      vi.mocked(verify).mockResolvedValue(false);
      const dto = { login: 'login', password: '123456' };
      await expect(service.signIn(asResponse(), dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
    it('возвращает access_token и ставит куку при верном пароле', async () => {
      const dto = { login: 'user', password: '123456' };
      const user = { id: 1, passwordHash: 'hash' };
      jwtService.sign.mockReturnValue('token');
      refreshTokensRepository.saveToken.mockResolvedValue(undefined);
      usersService.findUserByLoginWithPassword.mockResolvedValue(user);
      vi.mocked(verify).mockResolvedValue(true);
      const result = await service.signIn(asResponse(), dto);
      expect(res.cookie).toHaveBeenCalled();
      expect(result.access_token).toBe('token');
    });
  });
  describe('revokeAllSessions', () => {
    it('удаляет все refresh-токены пользователя', async () => {
      await service.revokeAllSessions(999);
      expect(
        refreshTokensRepository.deleteAllTokensByUserId,
      ).toHaveBeenCalledWith(999, undefined);
    });
  });
  describe('logout', () => {
    it('отзывает текущую сессию', async () => {
      jwtService.verify.mockReturnValue({ jti: 'abc' });
      await service.logout(asResponse(), 'refresh-token');
      expect(res.clearCookie).toHaveBeenCalled();
      expect(refreshTokensRepository.deleteTokenById).toHaveBeenCalledWith(
        'abc',
      );
    });
    it('очищает куку и ничего не удаляет, если токена нет', async () => {
      await service.logout(asResponse(), undefined);
      expect(res.clearCookie).toHaveBeenCalled();
      expect(refreshTokensRepository.deleteTokenById).not.toHaveBeenCalled();
    });
    it('очищает куку и ничего не удаляет, если токен невалидный', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid');
      });
      await service.logout(asResponse(), 'token');
      expect(res.clearCookie).toHaveBeenCalled();
      expect(refreshTokensRepository.deleteTokenById).not.toHaveBeenCalled();
    });
  });
  describe('signUp', () => {
    const dto = {
      login: 'user1',
      email: 'user@mail.com',
      password: 'randPass',
      age: 15,
      description: 'blaBla',
    };

    it('бросает 409, если пользователь с такой почтой уже существует', async () => {
      usersService.findUserByEmail.mockResolvedValue({ id: 1 });
      await expect(service.signUp(asResponse(), dto)).rejects.toThrow(
        ConflictException,
      );
      expect(usersService.findUserByEmail).toHaveBeenCalledWith(dto.email);
      expect(usersService.createUser).not.toHaveBeenCalled();
    });
    it('бросает 409, если пользователь с таким логином уже существует', async () => {
      usersService.findUserByEmail.mockResolvedValue(null);
      usersService.findUserByLogin.mockResolvedValue({ id: 1 });
      await expect(service.signUp(asResponse(), dto)).rejects.toThrow(
        ConflictException,
      );
      expect(usersService.findUserByLogin).toHaveBeenCalledWith(dto.login);
      expect(usersService.createUser).not.toHaveBeenCalled();
    });
    it('успешная регистрация', async () => {
      const user = { id: 1 };
      usersService.findUserByEmail.mockResolvedValue(null);
      usersService.findUserByLogin.mockResolvedValue(null);
      usersService.createUser.mockResolvedValue(user);
      refreshTokensRepository.saveToken.mockResolvedValue(undefined);
      vi.mocked(hash).mockResolvedValue('hash');
      jwtService.sign.mockReturnValue('token');
      const result = await service.signUp(asResponse(), dto);
      expect(usersService.createUser).toHaveBeenCalledWith(
        {
          login: dto.login,
          email: dto.email,
          passwordHash: 'hash',
          age: dto.age,
          description: dto.description,
        },
        manager,
      );
      expect(refreshTokensRepository.saveToken).toHaveBeenCalledWith(
        expect.anything(),
        manager,
      );
      expect(res.cookie).toHaveBeenCalled();
      expect(result.access_token).toBe('token');
    });
  });
  describe('refresh', () => {
    it('бросает 401, если токена нет', async () => {
      await expect(service.refresh(asResponse(), undefined)).rejects.toThrow(
        UnauthorizedException,
      );
    });
    it('бросает 401, если токен невалидный', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid');
      });
      await expect(
        service.refresh(asResponse(), 'invalid-token'),
      ).rejects.toThrow(UnauthorizedException);
      expect(jwtService.verify).toHaveBeenCalled();
    });
    it('бросает 401, если сессии нет в БД', async () => {
      refreshTokensRepository.findTokenById.mockResolvedValue(null);
      jwtService.verify.mockReturnValue({ jti: 'abc', id: 999 });
      await expect(
        service.refresh(asResponse(), 'refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
      expect(refreshTokensRepository.findTokenById).toHaveBeenCalledWith('abc');
    });
    it('бросает 401, хэш токена не совпал', async () => {
      refreshTokensRepository.findTokenById.mockResolvedValue({
        tokenHash: 'wrong-hash',
      });
      jwtService.verify.mockReturnValue({ jti: 'abc', id: 999 });
      await expect(service.refresh(asResponse(), 'hash-token')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(refreshTokensRepository.findTokenById).toHaveBeenCalledWith('abc');
      expect(refreshTokensRepository.deleteTokenById).not.toHaveBeenCalled();
    });
    it('успех, обновляем токен', async () => {
      const token = 'refresh-token';
      const tokenHash = createHash('sha256').update(token).digest('hex');
      jwtService.sign.mockReturnValue('token');
      jwtService.verify.mockReturnValue({ jti: 'abc', id: 999 });
      refreshTokensRepository.findTokenById.mockResolvedValue({ tokenHash });
      refreshTokensRepository.deleteTokenById.mockResolvedValue({
        affected: 1,
      });
      const result = await service.refresh(asResponse(), token);
      expect(refreshTokensRepository.deleteTokenById).toHaveBeenCalledWith(
        'abc',
        manager,
      );
      expect(refreshTokensRepository.saveToken).toHaveBeenCalledWith(
        expect.anything(),
        manager,
      );
      expect(res.cookie).toHaveBeenCalled();
      expect(result.access_token).toBe('token');
    });
    it('бросает 401, если токен уже использован', async () => {
      const token = 'refresh-token';
      const tokenHash = createHash('sha256').update(token).digest('hex');
      jwtService.sign.mockReturnValue('token');
      jwtService.verify.mockReturnValue({ jti: 'abc', id: 999 });
      refreshTokensRepository.findTokenById.mockResolvedValue({ tokenHash });
      refreshTokensRepository.deleteTokenById.mockResolvedValue({
        affected: 0,
      });
      await expect(service.refresh(asResponse(), token)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(refreshTokensRepository.saveToken).not.toHaveBeenCalled();
      expect(res.cookie).not.toHaveBeenCalled();
    });
  });
});
