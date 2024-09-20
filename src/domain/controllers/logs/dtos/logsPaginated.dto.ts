import { paginatedMixin } from '../../common/dtos/paginated.mixin';
import { LogsDto } from '../dtos/logs.dto';

export class LogsPaginatedDto extends paginatedMixin(LogsDto) {}
