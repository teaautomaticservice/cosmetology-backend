import { CurrentUser } from '@decorators/currentUser';
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserEntity } from '@providers/postgresql/repositories/users/user.entity';

import { AppConfigDto } from './dtos/appConfigDto.dto';

@ApiTags('AppConfig')
@Controller('/app-config')
export class AppConfigController {
  @ApiOkResponse({
    description: 'App config has been got',
    type: AppConfigDto,
  })
  @Get('/')
  public async getAppConfig(@CurrentUser() currentUser: UserEntity | null): Promise<AppConfigDto> {
    return new AppConfigDto({ currentUser });
  }
}