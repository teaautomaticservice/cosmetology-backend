import { Observable } from 'rxjs';

import { Resources } from '@constants/resources';
import { RequestApp } from '@domain/types/request.types';
import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { AsyncContext } from '@utils/asyncContext';

@Injectable()
export class AssignAuthUser implements NestInterceptor {
  constructor(
    @Inject(Resources.AsyncContext)
    private readonly asyncContext: AsyncContext
  ) { }

  public async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request: RequestApp = context.switchToHttp().getRequest();

    if (request.user) {
      this.asyncContext.setUser(request.user);
    }

    return next.handle();
  }
}
