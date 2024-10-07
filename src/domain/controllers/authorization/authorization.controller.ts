import { Response } from 'express';

import {
  Body,
  Controller,
  Post,
  Res
} from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthorizationService } from '@services/authorization/authorization.service';

import { CurrentUserDto } from './dtos/currentUser.dto';
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
    type: CurrentUserDto,
  })
  public async login(
    @Body() loginForm: LoginFormDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<CurrentUserDto> {
    const { user, session } = await this.authorizationService.login({
      loginData: loginForm,
    });

    response.cookie('session', session, {
      sameSite: 'strict',
      httpOnly: true,
    });

    return new CurrentUserDto(user);
  }
}