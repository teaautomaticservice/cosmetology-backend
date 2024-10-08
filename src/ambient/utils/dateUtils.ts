import * as dayjs from 'dayjs';

dayjs.Ls.en.weekStart = 1;

export const dateUtils = {
  commonFormat: (date: string | Date): string => {
    return dayjs(date).format('YYYY-MM-DD');
  },
  subtract: (date: string | Date, value: number, unit: dayjs.ManipulateType): Date => {
    return dayjs(date).subtract(value, unit).toDate();
  },
  add: (date: string | Date, value: number, unit: dayjs.ManipulateType): Date => {
    return dayjs(date).add(value, unit).toDate();
  },
};
