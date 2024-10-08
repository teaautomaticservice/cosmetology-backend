import { CookieOptions } from 'express';

export const cookieUtils = {
  setOptions: ({
    expires,
  }: {
    expires?: Date;
  }): CookieOptions => ({
    ...(expires && { expires }),
    sameSite: 'none',
    httpOnly: true,
    secure: true,
  })
};