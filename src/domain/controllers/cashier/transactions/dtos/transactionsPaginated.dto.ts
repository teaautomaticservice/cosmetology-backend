import { paginatedMixin } from '@controllers/common/dtos/paginated.mixin';

import { GetTransactionDto } from './getTransaction.dto';

export class TransactionsPaginated extends paginatedMixin(GetTransactionDto) {}
