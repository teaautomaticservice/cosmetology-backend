import { ID } from '@domain/providers/common/common.type';
import { RequestApp } from '@domain/types/request.types';
import {
  ArgumentMetadata,
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  PipeTransform,
  Scope
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';

@Injectable({ scope: Scope.REQUEST })
export class ParseObjectIdPipe implements PipeTransform<string, ID | undefined> {
  constructor(@Inject(REQUEST) protected readonly request: RequestApp) { }

  public transform(value: string, metadata: ArgumentMetadata): ID | undefined {
    const { url, method } = this.request;

    if (!value) {
      throw new BadRequestException('Invalid ID', {
        description: `${method} ${url}. Value: ${value}`,
      });
    }

    const validId = Number(value);

    if (Number.isNaN(validId) || validId <= 0) {
      if (metadata.type === 'param') {
        throw new NotFoundException('Invalid ID', {
          description: `${method} ${url}. Value: ${value}`,
        });
      }

      throw new BadRequestException('Invalid ID', {
        description: `${method} ${url}. Value: ${value}`,
      });
    }

    return validId;
  }
}