import { paginatedMixin } from '@controllers/common/dtos/paginated.mixin';

import { CurrencyDto } from './currency.dto';

export class CurrencyPaginatedDto extends paginatedMixin(CurrencyDto) {}
