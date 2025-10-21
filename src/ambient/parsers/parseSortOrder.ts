import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { SortDirection } from '../types/sortDirection';

@Injectable()
export class ParseSortOrderPipe implements PipeTransform<string, 1 | -1 | undefined> {
  public transform(value?: string): 1 | -1 | undefined {
    if (!['ASC', 'DESC', undefined].includes(value)) {
      throw new BadRequestException('Invalid sort order');
    }

    return value ? (value === SortDirection.ASC ? 1 : -1) : undefined;
  }
}
