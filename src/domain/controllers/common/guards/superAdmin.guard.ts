import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { RequestApp } from '@typings/request.types';
import { UserStatus, UserType } from '@typings/users.types';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: RequestApp = context.switchToHttp().getRequest();

    if (request.user == null) {
      return false;
    }

    if (request.user.status !== UserStatus.Active) {
      return false;
    }

    if (request.user.type !== UserType.SuperAdministrator) {
      return false;
    }

    return true;
  }
}