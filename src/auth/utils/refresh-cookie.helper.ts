import type { Response } from 'express';
import { REFRESH_COOKIE_NAME, REFRESH_COOKIE_PATH } from './auth.constants.js';

export function setRefreshCookie(
  res: Response,
  value: string,
  expires: Date,
  secure: boolean,
) {
  res.cookie(REFRESH_COOKIE_NAME, value, {
    httpOnly: true,
    expires,
    secure,
    sameSite: 'lax',
    path: REFRESH_COOKIE_PATH,
  });
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
}
