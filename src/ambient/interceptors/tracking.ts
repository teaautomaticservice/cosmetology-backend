import { Response } from 'express';
import { Observable, tap } from 'rxjs';
import { v4 as uuid } from 'uuid';

import { HTTP_HEADER_X_TRACE_ID } from '@constants/common';
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
export class Tracking implements NestInterceptor {
  constructor(
    @Inject(Resources.AsyncContext) private readonly asyncContext: AsyncContext
  ) { }

  public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request: RequestApp = context.switchToHttp().getRequest();

    const traceId = this.getRequestTraceId(request) ?? this.createTraceId();

    this.asyncContext.setTraceId(traceId);

    return next.handle().pipe(
      tap(() => {
        const response: Response = context.switchToHttp().getResponse();

        response.setHeader(HTTP_HEADER_X_TRACE_ID, encodeURI(traceId));
      })
    );
  }

  protected getRequestTraceId(request: RequestApp): string | undefined {
    const traceIdHeaderValues = request.headers[HTTP_HEADER_X_TRACE_ID];

    return Array.isArray(traceIdHeaderValues) ? traceIdHeaderValues[0] : traceIdHeaderValues;
  }

  protected createTraceId(): string {
    return uuid();
  }
}
