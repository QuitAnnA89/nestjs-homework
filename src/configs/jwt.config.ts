import { type ConfigType, registerAs } from '@nestjs/config';
import type { JwtModuleOptions } from '@nestjs/jwt';
export function getJwtConfig(
  jwt: ConfigType<typeof jwtConfig>,
): JwtModuleOptions {
  return {
    secret: jwt.accessSecret,
    signOptions: {
      algorithm: 'HS256',
    },
  };
}
export const jwtConfig = registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  accessTtl: Number(process.env.JWT_ACCESS_TOKEN_TTL),
  refreshTtl: Number(process.env.JWT_REFRESH_TOKEN_TTL),
}));
