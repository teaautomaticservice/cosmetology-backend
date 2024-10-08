import { RequestApp } from '@domain/types/request.types';
import { UserStatus } from '@domain/types/users.types';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: RequestApp = context.switchToHttp().getRequest();

    if (request.user == null) {
      return false;
    }

    if (request.user.status !== UserStatus.Active) {
      return false;
    }

    return request !== undefined;
  }
}