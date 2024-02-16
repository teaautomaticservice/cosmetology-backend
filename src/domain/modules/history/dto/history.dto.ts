import type { ID } from '../history.typings';

interface HistoryReq {
  readonly id: ID;
  readonly date: Date;
  readonly owner: string;
  readonly message: string;
}

export class HistoryDto {
  readonly id: ID;
  readonly date: Date;
  readonly owner: string;
  readonly message: string;

  constructor({ id, date, owner, message }: HistoryReq) {
    this.id = id;
    this.date = date;
    this.owner = owner;
    this.message = message;
  }
}
