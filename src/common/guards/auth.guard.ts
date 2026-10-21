import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { jwtConfig } from '../../configs/jwt.config.js';
import { JwtPayload } from '../interfaces/jwt-payload.interface.js';
import { RequestWithUser } from '../interfaces/user-request.js';
@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    @Inject(jwtConfig.KEY)
    private readonly jwt: ConfigType<typeof jwtConfig>,
    private readonly jwtService: JwtService,
  ) {}
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    try {
      const authHeader = req.headers.authorization;
      const bearer = authHeader?.split(' ')[0];
      const token = authHeader?.split(' ')[1];
      if (bearer !== 'Bearer' || !token) {
        throw new UnauthorizedException('Пользователь не авторизован');
      }
      const user = this.jwtService.verify<JwtPayload>(token, {
        secret: this.jwt.accessSecret,
      });
      req.user = user;
    } catch (e) {
      throw new UnauthorizedException('Пользователь не авторизован');
    }
    return true;
  }
}
