import { paginatedMixin } from '../../common/dto/paginated.mixin';
import { LogsDto } from './logs.dto';

export class LogsPaginatedDto extends paginatedMixin(LogsDto) {}
