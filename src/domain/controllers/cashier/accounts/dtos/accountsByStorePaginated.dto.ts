import { paginatedMixin } from '@controllers/common/dtos/paginated.mixin';

import { GetAccountsByStoreDto } from './getAccountsByStore.dto';

export class AccountsByStorePaginated extends paginatedMixin(GetAccountsByStoreDto) {}
