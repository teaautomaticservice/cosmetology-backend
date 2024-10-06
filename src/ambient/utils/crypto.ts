import { genSalt, hash } from 'bcrypt';

export const encryptPassword = async (password: string): Promise<string> => {
  const salt = await genSalt(15);
  return await hash(password, salt);
};
