interface MessageReq {
  readonly message: string;
}

export class MessageDto {
  readonly message: string;

  constructor({ message }: MessageReq) {
    this.message = message;
  }
}
