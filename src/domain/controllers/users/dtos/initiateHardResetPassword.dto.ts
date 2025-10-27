import { ApiProperty } from '@nestjs/swagger';
import { ID } from '@providers/common/common.type';

export class InitiateHardResetPasswordDto {
  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
  })
  public readonly userId: ID;
}