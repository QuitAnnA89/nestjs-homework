import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Cron, CronExpression } from '@nestjs/schedule';
import { hash, verify } from 'argon2';
import type { Response } from 'express';
import { createHash } from 'node:crypto';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface.js';
import { RefreshPayload } from '../common/interfaces/refresh-payload.interface.js';
import { jwtConfig } from '../configs/jwt.config.js';
import { UsersService } from '../users/users.service.js';
import { SignInDto } from './dto/sign-in.dto.js';
import { SignUpDto } from './dto/sign-up.dto.js';
import { RefreshTokensRepository } from './refresh-tokens.repository.js';
@Injectable()
export class AuthService {
  constructor(
    @Inject(jwtConfig.KEY)
    private readonly jwt: ConfigType<typeof jwtConfig>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly refreshTokensRepository: RefreshTokensRepository,
  ) {}
  private readonly logger = new Logger(AuthService.name);

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupExpiredTokens() {
    const result = await this.refreshTokensRepository.deleteExpiredTokens(
      new Date(),
    );
    this.logger.log(`удалено истекших токенов ${result.affected}`);
  }

  async signUp(res: Response, dto: SignUpDto) {
    const { login, email, password, age, description } = dto;

    if (await this.usersService.findUserByEmail(email)) {
      this.logger.warn(
        `ошибка регистрации: пользователь с таким email уже существует`,
      );
      throw new ConflictException('Пользователь с такой почтой уже существует');
    }
    if (await this.usersService.findUserByLogin(login)) {
      this.logger.warn(
        `ошибка регистрации: пользователь с таким логином:${login} уже существует`,
      );
      throw new ConflictException(
        'Пользователь с таким логином уже существует',
      );
    }
    const passwordHash = await hash(password);
    const user = await this.usersService.createUser({
      login,
      email,
      passwordHash,
      age,
      description,
    });
    this.logger.log(
      `успех: пользователь зарегистрировался под userId=${user.id}`,
    );
    return this.issueTokensWithCookie(res, user.id);
  }

  async signIn(res: Response, dto: SignInDto) {
    const { login, password } = dto;

    const user = await this.usersService.findUserByLoginWithPassword(login);

    if (!user) {
      this.logger.warn(
        `ошибка входа: неверный логин пользователя login=${login}`,
      );
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    const isValidPassword = await verify(user.passwordHash, password);
    if (!isValidPassword) {
      this.logger.warn(
        `ошибка входа: пароль пользователя userId=${user.id}, login=${login}`,
      );
      throw new UnauthorizedException('Неверный логин или пароль');
    }
    this.logger.log(
      `успех: пользователь вошёл userId=${user.id}, login=${login}`,
    );
    return this.issueTokensWithCookie(res, user.id);
  }

  async refresh(res: Response, refresh_token: string | undefined) {
    let payload: RefreshPayload;
    if (!refresh_token) {
      this.logger.warn(`ошибка обновления токена: нет рефреш токена`);
      throw new UnauthorizedException('Недействительный токен');
    }

    try {
      payload = this.jwtService.verify<RefreshPayload>(refresh_token, {
        secret: this.jwt.refreshSecret,
      });
    } catch {
      this.logger.warn(
        `ошибка обновления токена: невалидный или просроченный токен`,
      );
      throw new UnauthorizedException('Недействительный токен');
    }
    const { jti, id } = payload;
    const session = await this.refreshTokensRepository.findTokenById(jti);
    if (!session) {
      this.logger.warn(
        `ошибка обновления токена: недействительная сессия пользователя userId=${id}, jti=${jti}`,
      );
      throw new UnauthorizedException('Недействительный токен');
    }
    const tokenHash = createHash('sha256').update(refresh_token).digest('hex');
    if (session.tokenHash !== tokenHash) {
      this.logger.warn(
        `ошибка обновления токена: недействительный хэш пользователя userId=${id}, jti=${jti}`,
      );
      throw new UnauthorizedException('Недействительный токен');
    }
    await this.refreshTokensRepository.deleteTokenById(jti);
    this.logger.log(
      `успех: токен обновлен у пользователя userId=${id}, jti=${jti}`,
    );
    return this.issueTokensWithCookie(res, id);
  }

  private async issueTokensWithCookie(res: Response, userId: number) {
    const { access_token, refresh_token, expiresAt } =
      await this.issueTokens(userId);
    this.setCookie(res, refresh_token, expiresAt);
    return { access_token };
  }

  private generateTokens(id: number) {
    const accessPayload: JwtPayload = { id };

    const jti = crypto.randomUUID();
    const refreshPayload: RefreshPayload = { id, jti };

    const access_token = this.jwtService.sign(accessPayload, {
      expiresIn: this.jwt.accessTtl,
      secret: this.jwt.accessSecret,
    });
    const refresh_token = this.jwtService.sign(refreshPayload, {
      expiresIn: this.jwt.refreshTtl,
      secret: this.jwt.refreshSecret,
    });

    return { access_token, refresh_token, jti };
  }

  async logout(res: Response, refresh_token: string | undefined) {
    res.clearCookie('refreshToken', { path: '/auth' });
    if (!refresh_token) {
      this.logger.warn(`ошибка выхода: у пользователя нет refresh-токена`);
      return;
    }
    let payload: RefreshPayload;
    try {
      payload = this.jwtService.verify<RefreshPayload>(refresh_token, {
        secret: this.jwt.refreshSecret,
      });
    } catch {
      this.logger.warn(`ошибка выхода: невалидный токен`);
      return;
    }
    const { id, jti } = payload;
    await this.refreshTokensRepository.deleteTokenById(jti);
    this.logger.log(
      `успех: пользователь вышел из сессии userId=${id}, jti=${jti}`,
    );
  }

  async revokeAllSessions(userId: number) {
    await this.refreshTokensRepository.deleteAllTokensByUserId(userId);
    this.logger.log(`успех: сессии пользователя удалены userId=${userId}`);
  }

  private async issueTokens(userId: number) {
    const { access_token, refresh_token, jti } = this.generateTokens(userId);
    const expiresAt = new Date(this.jwt.refreshTtl * 1000 + Date.now());
    const tokenHash = createHash('sha256').update(refresh_token).digest('hex');

    await this.refreshTokensRepository.saveToken({
      id: jti,
      userId: userId,
      tokenHash,
      expiresAt,
    });

    return { access_token, refresh_token, expiresAt };
  }
  private setCookie(res: Response, value: string, expires: Date) {
    res.cookie('refreshToken', value, {
      httpOnly: true,
      expires,
      secure: false,
      sameSite: 'lax',
      path: '/auth',
    });
  }
}
