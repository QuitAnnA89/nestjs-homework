import { NotFoundException, UnauthorizedException } from '@nestjs/common';

export async function notFoundAsUnauthorized<T>(
  action: () => Promise<T>,
): Promise<T> {
  try {
    return await action();
  } catch (e) {
    if (e instanceof NotFoundException) {
      throw new UnauthorizedException('Пользователь не авторизован');
    }
    throw e;
  }
}
