import { Request, Response } from 'express';

import { CurrentUser } from '@decorators/currentUser';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiQuery,
  ApiTags
} from '@nestjs/swagger';
import { UserEntity } from '@providers/postgresql/repositories/users/user.entity';
import { AuthorizationService } from '@services/authorization/authorization.service';
import { UserStatus } from '@typings/users.types';
import { cookieUtils } from '@utils/cookieUtils';

import { LoginFormDto } from './dtos/loginForm.dto';
import { SetupNewPasswordDto } from './dtos/setupNewPassword.dto';
import { AuthorizationCookieDto } from '../common/dtos/authorizationCookie.dto';
import { CurrentUserDto } from '../common/dtos/currentUser.dto';

@ApiTags('Authorization')
@Controller('/authorization')
export class AuthorizationController {
  constructor(private readonly authorizationService: AuthorizationService) { }

  @Post('/login')
  @ApiBody({
    description: 'User login',
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

  @Get('/auth-by-user-token')
  @ApiOkResponse({
    description: 'User success login',
    type: CurrentUserDto,
  })
  @ApiQuery({ name: 'userToken', type: 'string' })
  public async authByUserToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Query('userToken') userToken: string,
    @CurrentUser() currentUser: UserEntity | null
  ): Promise<CurrentUserDto | null> {
    if (currentUser) {
      return new CurrentUserDto(currentUser);
    }

    const cookies = new AuthorizationCookieDto(request);

    const result = await this.authorizationService.loginByUserToken({ userToken, cookies });

    if (!result) {
      return null;
    }

    const { user, session } = result;

    if (user.status !== UserStatus.Pending) {
      return null;
    }

    response.cookie('session', session.sessionId, cookieUtils.setOptions({
      expires: session.expireAt,
    }));

    return new CurrentUserDto(user);
  }

  @Post('/setup-new-password')
  @ApiBody({
    description: 'User login',
    type: SetupNewPasswordDto,
  })
  @ApiOkResponse({
    description: 'User success login',
    type: CurrentUserDto,
  })
  public async setupNewPassword(
    @Body() setupNewPasswordForm: SetupNewPasswordDto,
    @CurrentUser() currentUser: UserEntity | null
  ): Promise<CurrentUserDto> {
    if (!currentUser) {
      throw new BadRequestException('Authorized error');
    }

    const user = await this.authorizationService.setupNewPassword(
      currentUser,
      setupNewPasswordForm,
    );

    return new CurrentUserDto(user);
  }
}