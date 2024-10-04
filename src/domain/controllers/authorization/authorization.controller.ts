import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { LoginFormDto } from './dtos/loginForm.dto';

@ApiTags('Authorization')
@Controller('/authorization')
export class AuthorizationController {

  @Post('/login')
  @ApiBody({
    description: 'User update',
    type: LoginFormDto,
  })
  @ApiOkResponse({
    description: 'User success login',
  })
  public async login(@Body() loginForm: LoginFormDto): Promise<void> {
    console.log('login', loginForm);
  }
}