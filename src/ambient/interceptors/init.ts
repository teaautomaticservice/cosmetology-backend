import { finalize, Observable } from 'rxjs';

import { Resources } from '@commonConstants/resources';
import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { AsyncContext } from '@utils/asyncContext';

@Injectable()
export class Init implements NestInterceptor {
  constructor(
    @Inject(Resources.AsyncContext)
    private readonly asyncContext: AsyncContext
  ) { }

  public intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    this.asyncContext.registerIfNeed();

    return next.handle().pipe(
      finalize(() => {
        this.asyncContext.clear();
      })
    );
  }
}
