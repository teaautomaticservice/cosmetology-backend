import { paginatedMixin } from '@controllers/common/dtos/paginated.mixin';

import { HistoryDto } from './history.dto';

export class HistoryPaginatedDto extends paginatedMixin(HistoryDto) {}
