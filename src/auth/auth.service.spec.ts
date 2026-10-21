import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { hash, verify } from 'argon2';
import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service.js';

vi.mock('argon2');
describe('AuthService', () => {
  describe('signIn', () => {
    it('бросает 401, если пользователь не найден', async () => {
      const usersService = {
        findUserByLoginWithPassword: vi.fn().mockResolvedValue(null),
      };
      const service = new AuthService(
        {} as any,
        usersService as any,
        {} as any,
        {} as any,
      );
      const res = {} as any;
      const dto = { login: 'user', password: '123456' };
      await expect(service.signIn(res, dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
    it('бросает 401, если неверный пароль', async () => {
      const user = { id: 1, passwordHash: 'hash' };
      const usersService = {
        findUserByLoginWithPassword: vi.fn().mockResolvedValue(user),
      };
      const service = new AuthService(
        {} as any,
        usersService as any,
        {} as any,
        {} as any,
      );
      vi.mocked(verify).mockResolvedValue(false);
      const res = {} as any;
      const dto = { login: 'login', password: '123456' };
      await expect(service.signIn(res, dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
    it('возвращает access_token и ставит куку при верном пароле', async () => {
      const jwt = {
        accessSecret: 'a',
        refreshSecret: 'r',
        accessTtl: 900,
        refreshTtl: 604800,
      };
      const dto = { login: 'user', password: '123456' };
      const user = { id: 1, passwordHash: 'hash' };
      const jwtService = { sign: vi.fn().mockReturnValue('token') };
      const refreshTokensRepository = {
        saveToken: vi.fn().mockResolvedValue(undefined),
      };
      const usersService = {
        findUserByLoginWithPassword: vi.fn().mockResolvedValue(user),
      };
      vi.mocked(verify).mockResolvedValue(true);
      const res = { cookie: vi.fn() } as any;
      const service = new AuthService(
        jwt as any,
        usersService as any,
        jwtService as any,
        refreshTokensRepository as any,
      );
      const result = await service.signIn(res, dto);
      expect(res.cookie).toHaveBeenCalled();
      expect(result.access_token).toBe('token');
    });
  });
  describe('revokeAllSessions', () => {
    it('удаляет все refresh-токены пользователя', async () => {
      const refreshTokensRepository = {
        deleteAllTokensByUserId: vi.fn(),
      };
      const service = new AuthService(
        {} as any,
        {} as any,
        {} as any,
        refreshTokensRepository as any,
      );
      await service.revokeAllSessions(999);
      expect(
        refreshTokensRepository.deleteAllTokensByUserId,
      ).toHaveBeenCalledWith(999);
    });
  });
  describe('logout', () => {
    it('отзывает текущую сессию', async () => {
      const jwt = {
        accessSecret: 'a',
        refreshSecret: 'r',
        accessTtl: 900,
        refreshTtl: 604800,
      };
      const jwtService = {
        verify: vi.fn().mockReturnValue({ jti: 'abc' }),
      };
      const refreshTokensRepository = {
        deleteTokenById: vi.fn(),
      };
      const res = { clearCookie: vi.fn() } as any;
      const service = new AuthService(
        jwt as any,
        {} as any,
        jwtService as any,
        refreshTokensRepository as any,
      );
      await service.logout(res, 'refresh-token');
      expect(res.clearCookie).toHaveBeenCalled();
      expect(refreshTokensRepository.deleteTokenById).toHaveBeenCalledWith(
        'abc',
      );
    });
    it('очищает куку и ничего не удаляет, если токена нет', async () => {
      const refreshTokensRepository = { deleteTokenById: vi.fn() };
      const service = new AuthService(
        {} as any,
        {} as any,
        {} as any,
        refreshTokensRepository as any,
      );
      const res = { clearCookie: vi.fn() } as any;
      await service.logout(res, undefined);
      expect(res.clearCookie).toHaveBeenCalled();
      expect(refreshTokensRepository.deleteTokenById).not.toHaveBeenCalled();
    });
    it('очищает куку и ничего не удаляет, если токен невалидный', async () => {
      const refreshTokensRepository = { deleteTokenById: vi.fn() };
      const jwtService = {
        verify: vi.fn().mockImplementation(() => {
          throw new Error('invalid');
        }),
      };
      const service = new AuthService(
        {} as any,
        {} as any,
        jwtService as any,
        refreshTokensRepository as any,
      );
      const res = { clearCookie: vi.fn() } as any;
      await service.logout(res, 'token');
      expect(res.clearCookie).toHaveBeenCalled();
      expect(refreshTokensRepository.deleteTokenById).not.toHaveBeenCalled();
    });
  });
  describe('signUp', () => {
    it('бросает 409, если пользователь с такой почтой уже существует', async () => {
      const dto = {
        login: 'user1',
        email: 'user@mail.com',
        password: 'randPass',
        age: 15,
        description: 'blaBla',
      };
      const usersService = {
        findUserByEmail: vi.fn().mockResolvedValue({ id: 1 }),
        createUser: vi.fn(),
      };
      const service = new AuthService(
        {} as any,
        usersService as any,
        {} as any,
        {} as any,
      );
      await expect(service.signUp({} as any, dto)).rejects.toThrow(
        ConflictException,
      );
      expect(usersService.findUserByEmail).toHaveBeenCalledWith(dto.email);
      expect(usersService.createUser).not.toHaveBeenCalled();
    });
    it('бросает 409, если пользователь с таким логином уже существует', async () => {
      const dto = {
        login: 'user1',
        email: 'user@mail.com',
        password: 'randPass',
        age: 15,
        description: 'blaBla',
      };
      const usersService = {
        findUserByEmail: vi.fn().mockResolvedValue(null),
        findUserByLogin: vi.fn().mockResolvedValue({ id: 1 }),
        createUser: vi.fn(),
      };
      const service = new AuthService(
        {} as any,
        usersService as any,
        {} as any,
        {} as any,
      );
      await expect(service.signUp({} as any, dto)).rejects.toThrow(
        ConflictException,
      );
      expect(usersService.findUserByLogin).toHaveBeenCalledWith(dto.login);
      expect(usersService.createUser).not.toHaveBeenCalled();
    });
    it('успешная регистрация', async () => {
      const dto = {
        login: 'user1',
        email: 'user@mail.com',
        password: 'randPass',
        age: 15,
        description: 'blaBla',
      };
      const user = { id: 1 };
      const usersService = {
        findUserByEmail: vi.fn().mockResolvedValue(null),
        findUserByLogin: vi.fn().mockResolvedValue(null),
        createUser: vi.fn().mockResolvedValue(user),
      };
      const refreshTokensRepository = {
        saveToken: vi.fn().mockResolvedValue(undefined),
      };
      const jwt = {
        accessSecret: 'a',
        refreshSecret: 'r',
        accessTtl: 900,
        refreshTtl: 604800,
      };
      vi.mocked(hash).mockResolvedValue('hash');
      const jwtService = { sign: vi.fn().mockReturnValue('token') };
      const res = { cookie: vi.fn() } as any;
      const service = new AuthService(
        jwt as any,
        usersService as any,
        jwtService as any,
        refreshTokensRepository as any,
      );
      const result = await service.signUp(res, dto);
      expect(usersService.createUser).toHaveBeenCalledWith({
        login: dto.login,
        email: dto.email,
        passwordHash: 'hash',
        age: dto.age,
        description: dto.description,
      });
      expect(res.cookie).toHaveBeenCalled();
      expect(result.access_token).toBe('token');
    });
  });
  describe('refresh', () => {
    it('бросает 401, если токена нет', async () => {
      const service = new AuthService(
        {} as any,
        {} as any,
        {} as any,
        {} as any,
      );
      await expect(service.refresh({} as any, undefined)).rejects.toThrow(
        UnauthorizedException,
      );
    });
    it('бросает 401, если токен невалидный', async () => {
      const jwtService = {
        verify: vi.fn().mockImplementation(() => {
          throw new Error('invalid');
        }),
      };
      const service = new AuthService(
        {} as any,
        {} as any,
        jwtService as any,
        {} as any,
      );
      await expect(service.refresh({} as any, 'invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(jwtService.verify).toHaveBeenCalled();
    });
    it('бросает 401, если сессии нет в БД', async () => {
      const refreshTokensRepository = {
        findTokenById: vi.fn().mockResolvedValue(null),
      };
      const jwtService = {
        verify: vi.fn().mockReturnValue({ jti: 'abc', id: 999 }),
      };
      const service = new AuthService(
        {} as any,
        {} as any,
        jwtService as any,
        refreshTokensRepository as any,
      );
      await expect(service.refresh({} as any, 'refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(refreshTokensRepository.findTokenById).toHaveBeenCalledWith('abc');
    });
    it('бросает 401, хэш токена не совпал', async () => {
      const refreshTokensRepository = {
        findTokenById: vi.fn().mockResolvedValue({ tokenHash: 'wrong-hash' }),
        deleteTokenById: vi.fn(),
      };
      const jwtService = {
        verify: vi.fn().mockReturnValue({ jti: 'abc', id: 999 }),
      };
      const service = new AuthService(
        {} as any,
        {} as any,
        jwtService as any,
        refreshTokensRepository as any,
      );
      await expect(service.refresh({} as any, 'hash-token')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(refreshTokensRepository.findTokenById).toHaveBeenCalledWith('abc');
      expect(refreshTokensRepository.deleteTokenById).not.toHaveBeenCalled();
    });
    it('успех, обновляем токен', async () => {
      const jwt = {
        accessSecret: 'a',
        refreshSecret: 'r',
        accessTtl: 900,
        refreshTtl: 604800,
      };
      const jwtService = {
        sign: vi.fn().mockReturnValue('token'),
        verify: vi.fn().mockReturnValue({ jti: 'abc', id: 999 }),
      };
      const token = 'refresh-token';
      const tokenHash = createHash('sha256').update(token).digest('hex');
      const refreshTokensRepository = {
        findTokenById: vi.fn().mockResolvedValue({ tokenHash }),
        deleteTokenById: vi.fn(),
        saveToken: vi.fn(),
      };
      const res = { cookie: vi.fn() };
      const service = new AuthService(
        jwt as any,
        {} as any,
        jwtService as any,
        refreshTokensRepository as any,
      );
      const result = await service.refresh(res as any, token);
      expect(refreshTokensRepository.deleteTokenById).toHaveBeenCalledWith(
        'abc',
      );
      expect(res.cookie).toHaveBeenCalled();
      expect(result.access_token).toBe('token');
    });
  });
});
