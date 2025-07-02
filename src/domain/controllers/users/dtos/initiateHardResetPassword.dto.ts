import { ID } from '@domain/providers/common/common.type';
import { ApiProperty } from '@nestjs/swagger';

export class InitiateHardResetPasswordDto {
  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
  })
  public readonly userId: ID;
}