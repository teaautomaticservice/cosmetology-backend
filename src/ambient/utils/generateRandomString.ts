const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const numberChars = '0123456789';

export const generateRandomString = (
  length = 32,
  {
    isSpecialChars = true,
    isNumberChars = false,
  }: {
    isSpecialChars?: boolean;
    isNumberChars?: boolean;
  } = {},
): string => {
  let result = '';

  const allChars = letters +
    (isSpecialChars ? specialChars : '') +
    (isNumberChars ? numberChars : '');

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * allChars.length);
    result += allChars[randomIndex];
  }

  return result;
};