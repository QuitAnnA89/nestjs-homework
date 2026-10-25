import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  port: Number(process.env.PORT),
  cookieSecure: process.env.NODE_ENV === 'production',
}));
