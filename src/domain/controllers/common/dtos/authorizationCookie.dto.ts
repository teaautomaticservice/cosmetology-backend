import { Request } from 'express';

import { AuthorizationCookies } from '@typings/cookies.types';

export class AuthorizationCookieDto implements AuthorizationCookies {
  public session: string | null;

  constructor(request: Request) {
    this.session = request.cookies.session ?? null;
  }
}