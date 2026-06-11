import { ApiProperty } from '@nestjs/swagger';
import { ID } from '@providers/common/common.type';

import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class NewSwapDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
  })
  public amount: number;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
  })
  public readonly firstCreditId: ID;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
  })
  public readonly firstDebitId: ID;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
  })
  public readonly secondCreditId: ID;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
  })
  public readonly secondDebitId: ID;

  @IsOptional()
  @IsString()
  @ApiProperty({
    type: 'string',
    required: false,
    nullable: true,
  })
  public description: string | null;
}
