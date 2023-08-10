import type { ID } from './history.typings';

import { Injectable } from '@nestjs/common';

import { MessageDto } from './dto/message.dto';
import { HistoryDto } from './dto/history.dto';

@Injectable()
export class HistoryService {
  private historyList: HistoryDto[] = [
    {
      id: 0,
      date: new Date(),
      message: 'Server initialized!',
      owner: 'Server',
    },
  ];

  private get itemsCount() {
    return this.historyList.length;
  }

  private createHistory(id: ID, message: string) {
    return new HistoryDto({
      id: id,
      date: new Date(),
      message,
      owner: 'Owner',
    });
  }

  private getMessage(messageReq: MessageDto) {
    return new MessageDto(messageReq).message;
  }

  getHistoryList() {
    const formattedHistoryList = {
      data: this.historyList,
      meta: {
        pagination: {
          itemsCount: this.itemsCount,
          itemsCurrent: [0, this.itemsCount],
        },
      },
    };

    return formattedHistoryList;
  }

  addHistory(messageReq: MessageDto) {
    const message = this.getMessage(messageReq);
    const newHistory = this.createHistory(this.historyList.length, message);

    this.historyList.push(newHistory);

    return this.getHistoryList();
  }

  findHistory(currentId: string) {
    const fundedItem = this.historyList.find(
      ({ id }) => id === parseInt(currentId),
    );
    return fundedItem;
  }

  updateHistory(currentId: string, messageReq: MessageDto) {
    const formattedCurrentId = parseInt(currentId);
    const indexItem = this.historyList.findIndex(
      ({ id }) => id === formattedCurrentId,
    );

    console.log(indexItem);

    if (indexItem < 0) {
      return null;
    }

    if (this.itemsCount === 0) {
      return null;
    }

    const message = this.getMessage(messageReq);
    const newHistory = this.createHistory(formattedCurrentId, message);

    this.historyList[indexItem] = newHistory;

    return this.getHistoryList();
  }

  removeHistory(currentId: string) {
    const formattedCurrentId = parseInt(currentId);
    const indexItem = this.historyList.findIndex(
      ({ id }) => id === formattedCurrentId,
    );
    this.historyList.splice(indexItem, 1);

    return this.getHistoryList();
  }
}
