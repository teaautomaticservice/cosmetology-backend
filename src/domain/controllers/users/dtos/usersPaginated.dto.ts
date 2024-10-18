import { paginatedMixin } from '@domain/controllers/common/dtos/paginated.mixin';

import { UsersDto } from './users.dto';

export class UsersPaginatedDto extends paginatedMixin(UsersDto) {}
