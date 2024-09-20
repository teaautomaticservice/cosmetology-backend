import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
  })
  public count: number;

  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
  })
  public currentPage: number;

  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
  })
  public itemsPerPage: number;
}
