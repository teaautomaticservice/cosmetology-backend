import { paginatedMixin } from '@controllers/common/dtos/paginated.mixin';

import { GetAccountAggregatedWithStorage } from './GetAccountAggregatedWithStorage.dto';

export class AccountsAggregatedWithStoragePaginated extends paginatedMixin(GetAccountAggregatedWithStorage) {};