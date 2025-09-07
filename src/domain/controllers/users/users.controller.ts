import { QueryInt } from '@decorators/queryInt';
import { Pagination } from '@domain/providers/common/common.type';
import { UserService } from '@domain/services/user/user.service';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Post,
  UseGuards
} from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';

import { CreateUserDto } from './dtos/createUser.dto';
import { InitiateHardResetPasswordDto } from './dtos/initiateHardResetPassword.dto';
import { UsersDto } from './dtos/users.dto';
import { UsersPaginatedDto } from './dtos/usersPaginated.dto';
import { AdminGuard } from '../common/guards/admin.guard';

@ApiTags('Users')
@Controller('/users')
export class UsersController {
  constructor(private readonly userService: UserService) { }

  @UseGuards(AdminGuard)
  @Get('/')
  @ApiParam({ name: 'page', required: false })
  @ApiParam({ name: 'pageSize', required: false })
  @ApiOkResponse({
    description: 'List of users successful has been got',
    type: UsersPaginatedDto,
  })
  public async getUsers(
    @QueryInt('page', 1) page: number,
    @QueryInt('pageSize', 10) pageSize: number
  ): Promise<UsersPaginatedDto> {
    const pagination: Pagination = { page, pageSize };
    const [users, count] = await this.userService.getUsersList({ pagination });
    return {
      data: users.map((user) => new UsersDto(user)),
      meta: {
        count: count,
        currentPage: 1,
        itemsPerPage: 10,
      }
    };
  }

  @UseGuards(AdminGuard)
  @Get('/:id')
  @ApiParam({ name: 'id' })
  @ApiOkResponse({
    description: 'User by ID successful has been got',
    type: UsersDto,
  })
  public async getUserById(@QueryInt('id') id: number): Promise<UsersDto> {
    const user = await this.userService.getUserById(id);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return new UsersDto(user);
  }

  @UseGuards(AdminGuard)
  @Post('/create')
  @ApiBody({
    description: 'Create user',
    type: CreateUserDto,
  })
  @ApiOkResponse({
    description: 'User was created',
    type: UsersDto,
  })
  public async createUser(@Body() newUserData: CreateUserDto): Promise<UsersDto> {
    const user = await this.userService.createUserByAmin(newUserData);
    return new UsersDto(user);
  }

  @UseGuards(AdminGuard)
  @Post('/initiate-hard-reset-password')
  @ApiBody({
    description: 'Initiate hard reset password for user',
    type: InitiateHardResetPasswordDto,
  })
  @ApiOkResponse({
    description: 'Hard reset password has been initiated',
    type: UsersDto,
  })
  public async initiateHardResetPassword(
    @Body() initiateHardResetPasswordData: InitiateHardResetPasswordDto,
  ): Promise<UsersDto> {
    const user = await this.userService.initiateHardResetPassword(initiateHardResetPasswordData);
    if (!user) {
      throw new InternalServerErrorException('User not found');
    }

    return new UsersDto(user);
  }

  @UseGuards(AdminGuard)
  @Get('/restart-complete-registration/:id')
  @ApiOkResponse({
    description: 'Restart complete registration has been initiated',
    type: UsersDto,
  })
  public async restartCompleteRegistration(@QueryInt('id') id: number): Promise<UsersDto> {
    const user = await this.userService.restartCompleteRegistration({ userId: id });
    if (!user) {
      throw new InternalServerErrorException('User not found');
    }

    return new UsersDto(user);
  }
}
