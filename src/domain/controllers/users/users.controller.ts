import { QueryInt } from '@decorators/queryInt';
import { Pagination } from '@domain/providers/common/common.type';
import { UsersProvider } from '@domain/providers/users/users.provider';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';

import { UsersDto } from './dtos/users.dto';
import { UsersPaginatedDto } from './dtos/usersPaginated.dto';
import { AdminGuard } from '../common/guards/admin.guard';

@ApiTags('Users')
@Controller('/users')
export class UsersController {
  constructor(private readonly usersProvider: UsersProvider) {}

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
    const [users, count] = await this.usersProvider.findAndCount({ pagination });
    return {
      data: users.map((user) => new UsersDto(user)),
      meta: {
        count: count,
        currentPage: 1,
        itemsPerPage: 10,
      }
    };
  }
}
