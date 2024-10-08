import { AuthorizationCookies } from '@domain/types/cookies.types';
import { Request } from 'express';

export class AuthorizationCookieDto implements AuthorizationCookies {
  session: string | null;

  constructor(request: Request) {
    this.session = request.cookies.session ?? null;
  }
}