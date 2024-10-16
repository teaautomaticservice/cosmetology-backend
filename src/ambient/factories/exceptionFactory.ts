import { BadRequestException, ValidationError } from '@nestjs/common';

export const exceptionFactory = (errors: ValidationError[]): BadRequestException => {
  const formattedErrors = errors.reduce((acc, error) => {
    const field = error.property;
    const messages = Object.values(error.constraints || {});

    //eslint-disable-next-line no-param-reassign
    acc[field] = messages;
    return acc;
  }, {});
  return new BadRequestException({
    statusCode: 400,
    message: formattedErrors,
  });;
};