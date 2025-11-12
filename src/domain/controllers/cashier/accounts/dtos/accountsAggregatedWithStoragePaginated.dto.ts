import { paginatedMixin } from '@controllers/common/dtos/paginated.mixin';

import { GetAccountAggregatedWithStorage } from './getAccountAggregatedWithStorage.dto';

export class AccountsAggregatedWithStoragePaginated extends paginatedMixin(GetAccountAggregatedWithStorage) {};