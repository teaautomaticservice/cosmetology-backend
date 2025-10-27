import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { RequestApp } from '@typings/request.types';
import { UserStatus, UserType } from '@typings/users.types';

@Injectable()
export class AdminGuard implements CanActivate {
  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: RequestApp = context.switchToHttp().getRequest();

    if (request.user == null) {
      return false;
    }

    if (request.user.status !== UserStatus.Active) {
      return false;
    }

    if (![
      UserType.Administrator,
      UserType.SuperAdministrator,
    ].includes(request.user.type)) {
      return false;
    }

    return true;
  }
}