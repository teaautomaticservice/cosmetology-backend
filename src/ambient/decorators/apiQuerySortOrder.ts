import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { SwaggerEnumType } from '@nestjs/swagger/dist/types/swagger-enum.type';

import { SortDirection } from '../types/sortDirection';

export const ApiQuerySortOrder = (enumType?: SwaggerEnumType): ReturnType<typeof applyDecorators> => {
  return applyDecorators(
    ApiQuery({ name: 'order', required: false, enum: SortDirection }),
    ApiQuery({ name: 'sort', required: false, enum: enumType })
  );
};