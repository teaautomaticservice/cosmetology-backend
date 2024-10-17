import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { AdminGuard } from '../common/guards/admin.guard';

@ApiTags('Users')
@Controller('/users')
export class UsersController {
  @UseGuards(AdminGuard)
  @Get('/')
  @ApiOkResponse({
    description: 'List of users successful has been got',
  })
  getUsers() {
    console.log('getUsers');
  }
}