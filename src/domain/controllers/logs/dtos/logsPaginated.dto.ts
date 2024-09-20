import { paginatedMixin } from '@controllers/common/dtos/paginated.mixin';

import { LogsDto } from './logs.dto';

export class LogsPaginatedDto extends paginatedMixin(LogsDto) {}
