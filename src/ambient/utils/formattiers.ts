export const getNumberFromString = (val: string | undefined = '0'): number => {
  const result = Number(val);
  if (Number.isNaN(result)) {
    return 0;
  }

  return result;
};