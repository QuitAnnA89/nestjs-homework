import {
  Body,
  Controller,
  HttpCode,
  Inject,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type { Request, Response } from 'express';
import { appConfig } from '../configs/app.config.js';
import { AuthService } from './auth.service.js';
import { SignInDto } from './dto/sign-in.dto.js';
import { SignUpDto } from './dto/sign-up.dto.js';
import { REFRESH_COOKIE_NAME } from './utils/auth.constants.js';
import {
  clearRefreshCookie,
  setRefreshCookie,
} from './utils/refresh-cookie.helper.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(appConfig.KEY)
    private readonly app: ConfigType<typeof appConfig>,
  ) {}

  @Post('sign-up')
  @HttpCode(201)
  async signUp(
    @Res({ passthrough: true }) res: Response,
    @Body() dto: SignUpDto,
  ) {
    const tokens = await this.authService.signUp(dto);
    setRefreshCookie(
      res,
      tokens.refresh_token,
      tokens.expiresAt,
      this.app.cookieSecure,
    );
    return { access_token: tokens.access_token };
  }
  @HttpCode(200)
  @Post('sign-in')
  async signIn(
    @Res({ passthrough: true }) res: Response,
    @Body() dto: SignInDto,
  ) {
    const tokens = await this.authService.signIn(dto);
    setRefreshCookie(
      res,
      tokens.refresh_token,
      tokens.expiresAt,
      this.app.cookieSecure,
    );
    return { access_token: tokens.access_token };
  }
  @HttpCode(200)
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.refresh(
      req.cookies[REFRESH_COOKIE_NAME] as string | undefined,
    );
    setRefreshCookie(
      res,
      tokens.refresh_token,
      tokens.expiresAt,
      this.app.cookieSecure,
    );
    return { access_token: tokens.access_token };
  }
  @HttpCode(204)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    clearRefreshCookie(res);
    await this.authService.logout(
      req.cookies[REFRESH_COOKIE_NAME] as string | undefined,
    );
  }
}
