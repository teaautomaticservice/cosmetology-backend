import { CLIENT_ORIGIN } from '@commonConstants/env';

export const clientCompleteRegistration = (userToken: string): string =>
  `${CLIENT_ORIGIN}/complete-registration?userToken=${userToken}`;