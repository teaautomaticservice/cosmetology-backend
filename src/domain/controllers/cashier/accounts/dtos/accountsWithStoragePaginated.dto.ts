import { paginatedMixin } from '@controllers/common/dtos/paginated.mixin';

import { GetAccountWithStorageDto } from './getAccountWithStorage.dto';

export class AccountsWithStoragePaginatedDto extends paginatedMixin(GetAccountWithStorageDto) {}
