import { UserEntity } from '@domain/providers/postgresql/repositories/users/user.entity';
import { ID } from '@providers/common/common.type';
import { MessageEntity } from '@providers/postgresql/repositories/history/message.entity';

export class historyWithUsersDto {
  public readonly id: ID;
  public readonly date: Date;
  public readonly message: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;
  public readonly createdByUser?: UserEntity | undefined;
  public readonly updatedByUser?: UserEntity | undefined;

  constructor({
    messageEntity,
    createdByUser,
    updatedByUser,
  }: {
    messageEntity: MessageEntity;
    createdByUser?: UserEntity | null;
    updatedByUser?: UserEntity | null;
  }) {
    const {
      id,
      date,
      message,
      createdAt,
      updatedAt,
    } = messageEntity;

    this.id = id;
    this.date = date;
    this.message = message;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.createdByUser = createdByUser ?? undefined;
    this.updatedByUser = updatedByUser ?? undefined;
  }
}
