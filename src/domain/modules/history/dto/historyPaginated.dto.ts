import { paginatedMixin } from '../../common/dto/paginated.mixin';
import { HistoryDto } from './history.dto';

export class HistoryPaginatedDto extends paginatedMixin(HistoryDto) {}
