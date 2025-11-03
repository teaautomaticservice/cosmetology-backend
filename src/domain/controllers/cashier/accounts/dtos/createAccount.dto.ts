import { ApiProperty } from '@nestjs/swagger';
import { ID } from '@providers/common/common.type';

import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString
} from 'class-validator';

export class CreateAccountDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    type: 'string',
    required: true,
    nullable: false,
  })
  public name: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    type: 'string',
    required: true,
    nullable: true,
  })
  public description: string | null;

  @IsArray()
  @IsNumber({}, { each: true })
  @ApiProperty({
    type: 'string',
    required: true,
    nullable: false,
    isArray: true
  })
  public moneyStorageIds: ID[];

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
  })
  public currencyId: ID;
}