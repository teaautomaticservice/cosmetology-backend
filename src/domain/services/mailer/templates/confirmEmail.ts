import { clientCompleteRegistration } from '@domain/constants/urls';

import { commonTemplate } from './common';

const head =
  `<style>
  .content {
    color: black;
  }
</style>`;

const content = ({
  title,
  displayName,
  userToken
}: {
  title: string;
  displayName: string;
  userToken: string;
}): string =>
  `<div class="content">
    <h1>${title}</h1>
    <p>Dear, ${displayName}</P>
    <p>You have been registered in the app by an admin.</p>
    <p>Please verify your email and complete your registration using the link below:</p>
    <a href='${clientCompleteRegistration(userToken)}'>Complete registration</a>
    <p>If you think this message is a mistake, you can ignore it.</p>
</div>`;

export const confirmEmailCreatedUserByAdmin = ({
  title,
  displayName,
  userToken,
}: {
  title: string;
  displayName: string;
  userToken: string;
}): string => commonTemplate({
  head,
  title,
  content: content({
    title,
    displayName,
    userToken,
  }),
});