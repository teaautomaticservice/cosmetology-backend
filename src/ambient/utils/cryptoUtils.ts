import { compare, genSalt, hash } from 'bcrypt';

export const cryptoUtils = {
  encryptPassword: async (password: string): Promise<string> => {
    const salt = await genSalt(15);
    return await hash(password, salt);
  },
  compare,
};