import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseString implements PipeTransform<string | undefined, string | undefined> {
  public transform(value?: string): string | undefined {
    if (value) {
      return value.trim();
    }
  }
}
