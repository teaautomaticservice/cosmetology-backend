import { Request, Response } from 'express';

import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthorizationService } from '@services/authorization/authorization.service';
import { cookieUtils } from '@utils/cookieUtils';

import { LoginFormDto } from './dtos/loginForm.dto';
import { AuthorizationCookieDto } from '../common/dtos/authorizationCookie.dto';
import { CurrentUserDto } from '../common/dtos/currentUser.dto';

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

  @Get('/logout')
  @ApiOkResponse({
    description: 'User success log out',
  })
  public async logOut(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const cookies = new AuthorizationCookieDto(request);

    await this.authorizationService.logOut(cookies);

    response.clearCookie('session');
  }
}