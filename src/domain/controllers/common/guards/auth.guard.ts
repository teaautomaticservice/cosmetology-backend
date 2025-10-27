import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { RequestApp } from '@typings/request.types';
import { UserStatus } from '@typings/users.types';

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

    return true;
  }
}