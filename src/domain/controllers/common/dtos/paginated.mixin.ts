import { mixin } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger';

import { PaginationMetaDto } from './paginationMeta.dto';

type Constructor<T = object> = new (...args: unknown[]) => T;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function paginatedMixin<Dto extends Constructor>(
  Base: Dto,
  options?: ApiPropertyOptions | undefined,
) {
  class Paginated {
    @ApiProperty({
      isArray: true,
      type: Base,
      ...options,
    })
    public data: Array<InstanceType<Dto>>;

    @ApiProperty({
      type: () => PaginationMetaDto,
      required: true,
      nullable: false,
    })
    public meta: PaginationMetaDto;
  }
  return mixin(Paginated);
}
