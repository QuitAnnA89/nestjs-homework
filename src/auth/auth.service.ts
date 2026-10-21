import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
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

  async signUp(res: Response, dto: SignUpDto) {
    const { login, email, password, age, description } = dto;

    if (await this.usersService.findUserByEmail(email)) {
      throw new ConflictException('Пользователь с такой почтой уже существует');
    }
    if (await this.usersService.findUserByLogin(login)) {
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

    return this.issueTokensWithCookie(res, user.id);
  }

  async signIn(res: Response, dto: SignInDto) {
    const { login, password } = dto;

    const user = await this.usersService.findUserByLoginWithPassword(login);

    if (!user) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    const isValidPassword = await verify(user.passwordHash, password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }
    return this.issueTokensWithCookie(res, user.id);
  }

  async refresh(res: Response, refresh_token: string | undefined) {
    if (!refresh_token) {
      throw new UnauthorizedException('Недействительный токен');
    }
    let payload: RefreshPayload;
    try {
      payload = this.jwtService.verify<RefreshPayload>(refresh_token, {
        secret: this.jwt.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Недействительный токен');
    }
    const { jti, id } = payload;
    const session = await this.refreshTokensRepository.findTokenById(jti);
    if (!session) {
      throw new UnauthorizedException('Недействительный токен');
    }
    const tokenHash = createHash('sha256').update(refresh_token).digest('hex');
    if (session.tokenHash !== tokenHash) {
      throw new UnauthorizedException('Недействительный токен');
    }
    await this.refreshTokensRepository.deleteTokenById(jti);
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
      return;
    }
    let payload: RefreshPayload;
    try {
      payload = this.jwtService.verify<RefreshPayload>(refresh_token, {
        secret: this.jwt.refreshSecret,
      });
    } catch {
      return;
    }
    const { jti } = payload;

    await this.refreshTokensRepository.deleteTokenById(jti);
  }

  async revokeAllSessions(userId: number) {
    await this.refreshTokensRepository.deleteAllTokensByUserId(userId);
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
