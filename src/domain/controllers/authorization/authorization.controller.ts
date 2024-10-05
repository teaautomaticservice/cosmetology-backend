import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthorizationService } from '@services/authorization/authorization.service';

import { LoginFormDto } from './dtos/loginForm.dto';

@ApiTags('Authorization')
@Controller('/authorization')
export class AuthorizationController {
  constructor(private readonly authorizationService: AuthorizationService) {}

  @Post('/login')
  @ApiBody({
    description: 'User update',
    type: LoginFormDto,
  })
  @ApiOkResponse({
    description: 'User success login',
  })
  public async login(@Body() loginForm: LoginFormDto): Promise<void> {
    this.authorizationService.loginByPassword({
      loginData: loginForm,
    });
  }
}