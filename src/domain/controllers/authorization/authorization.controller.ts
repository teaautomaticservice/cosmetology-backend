import { Response, Request } from 'express';

import {
  Body,
  Controller,
  Post,
  Req,
  Res
} from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthorizationService } from '@services/authorization/authorization.service';

import { CurrentUserDto } from './dtos/currentUser.dto';
import { LoginFormDto } from './dtos/loginForm.dto';
import { cookieUtils } from '@utils/cookieUtils';
import { AuthorizationCookieDto } from './dtos/authorizationCookie.dto';

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
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<CurrentUserDto> {
    const cookies = new AuthorizationCookieDto(request);

    const { user, session } = await this.authorizationService.login({
      loginData: loginForm,
      cookies,
    });

    response.cookie('session', session.sessionId, cookieUtils.setOptions({
      expires: session.expireAt,
    }));

    return new CurrentUserDto(user);
  }
}