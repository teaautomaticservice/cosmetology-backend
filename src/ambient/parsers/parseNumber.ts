import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseNumber
  implements PipeTransform<string | undefined, number | undefined>
{
  public transform(value?: string): number | undefined {
    if (typeof value === 'string') {
      const result = Number(value);
      if (Number.isNaN(result)) {
        throw new BadRequestException(`Invalid value ${value}`);
      }
      return result;
    }

    return 10;
  }
}
