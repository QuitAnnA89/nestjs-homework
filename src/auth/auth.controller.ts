import { Body, Controller, HttpCode, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { REFRESH_COOKIE_NAME } from './auth.constants.js';
import { AuthService } from './auth.service.js';
import { SignInDto } from './dto/sign-in.dto.js';
import { SignUpDto } from './dto/sign-up.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  @HttpCode(201)
  signUp(@Res({ passthrough: true }) res: Response, @Body() dto: SignUpDto) {
    return this.authService.signUp(res, dto);
  }
  @HttpCode(200)
  @Post('sign-in')
  signIn(@Res({ passthrough: true }) res: Response, @Body() dto: SignInDto) {
    return this.authService.signIn(res, dto);
  }
  @HttpCode(200)
  @Post('refresh')
  refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.refresh(
      res,
      req.cookies[REFRESH_COOKIE_NAME] as string | undefined,
    );
  }
  @HttpCode(204)
  @Post('logout')
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.logout(
      res,
      req.cookies[REFRESH_COOKIE_NAME] as string | undefined,
    );
  }
}
