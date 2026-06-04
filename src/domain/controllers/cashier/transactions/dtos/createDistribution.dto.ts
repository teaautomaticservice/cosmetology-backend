import { ApiProperty } from '@nestjs/swagger';
import { ID } from '@providers/common/common.type';

import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class DistributedAccountDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
  })
  public readonly amount: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
  })
  public readonly debitId: ID;
}

export class CreateDistributionDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
  })
  public readonly creditId: ID;

  @IsOptional()
  @IsString()
  @ApiProperty({
    type: 'string',
    required: true,
    nullable: true,
  })
  public readonly description: string | null;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DistributedAccountDto)
  @ApiProperty({
    type: () => DistributedAccountDto,
    required: true,
    nullable: false,
    isArray: true,
  })
  public readonly distributedAccounts: DistributedAccountDto[];
}
