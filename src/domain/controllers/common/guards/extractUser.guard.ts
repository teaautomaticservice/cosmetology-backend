import { AuthorizationService } from '@domain/services/authorization/authorization.service';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { AuthorizationCookieDto } from '../dtos/authorizationCookie.dto';

@Injectable()
export class ExtractUserGuard implements CanActivate {
  constructor(private readonly authorizationService: AuthorizationService) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const { session } = new AuthorizationCookieDto(request);

    if (session) {
      request.user = await this.authorizationService.getUserBySessionId(session);
    } else {
      request.user = null;
    }

    return true;
  }
}