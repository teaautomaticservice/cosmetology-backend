import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseBoolean implements PipeTransform<string | undefined, boolean | undefined> {
  public transform(value?: string): boolean | undefined {
    if (value) {
      return value === 'true';
    }
  }
}
