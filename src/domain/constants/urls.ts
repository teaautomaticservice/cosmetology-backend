import { CLIENT_ORIGIN } from '@constants/env';

export const clientCompleteRegistration = (userToken: string): string =>
  `${CLIENT_ORIGIN}/complete-registration?userToken=${userToken}`;