import { paginatedMixin } from '../../common/dtos/paginated.mixin';
import { HistoryDto } from './history.dto';

export class HistoryPaginatedDto extends paginatedMixin(HistoryDto) {}
