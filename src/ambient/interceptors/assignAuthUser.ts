import { Observable } from 'rxjs';

import { Resources } from '@commonConstants/resources';
import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { RequestApp } from '@typings/request.types';
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
