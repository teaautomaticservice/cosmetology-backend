const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const allChars = letters + specialChars;

export const generateRandomString = (length = 32): string => {
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * allChars.length);
    result += allChars[randomIndex];
  }

  return result;
};