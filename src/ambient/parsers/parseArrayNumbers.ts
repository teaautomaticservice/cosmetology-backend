import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class parseArrayNumbers implements PipeTransform<string | undefined, number[] | undefined> {
  public transform(value?: string): number[] | undefined {
    if (value) {
      return value.split(',').map(Number);
    }
  }
}
