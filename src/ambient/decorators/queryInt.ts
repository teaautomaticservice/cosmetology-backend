import { BadRequestException, DefaultValuePipe, ParseIntPipe, Query } from '@nestjs/common';

export const QueryInt = (name: string, defaultValue?: number | null): ParameterDecorator => {
  if (defaultValue === null) {
    return Query(
      name,
      new ParseIntPipe({
        exceptionFactory: (error: string): Error => {
          return new BadRequestException(`'${name}': ${error}`);
        },
      })
    );
  }
  return Query(name, new DefaultValuePipe(defaultValue), new ParseIntPipe({ optional: defaultValue === undefined }));
};
