import * as dayjs from 'dayjs';

dayjs.Ls.en.weekStart = 1;

export const commonFormat = (date: string | Date): string => {
  return dayjs(date).format('YYYY-MM-DD');
};

export const subtract = (date: string | Date, value: number, unit: dayjs.ManipulateType): Date => {
  return dayjs(date).subtract(value, unit).toDate();
};

export { dayjs as timestamp };
