import { paginatedMixin } from '@controllers/common/dtos/paginated.mixin';

import { MoneyStorageDto } from './moneyStorage.dto';

export class MoneyStoragePaginatedDto extends paginatedMixin(MoneyStorageDto) {}
