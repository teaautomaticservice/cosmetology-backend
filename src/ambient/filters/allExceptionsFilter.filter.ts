import { Response } from 'express';

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpExceptionOptions,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  public catch(exception: Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = HttpStatus.BAD_REQUEST;
    const message = exception.message;
    const cause = 'cause' in exception ? (exception as HttpExceptionOptions).cause : undefined;

    response.status(status).json({
      statusCode: status,
      message: message || 'Internal server error',
      cause,
    });
  }
}
