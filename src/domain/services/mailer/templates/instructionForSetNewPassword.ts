import { APP_NAME } from '@commonConstants/env';

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
}: {
  title: string;
  displayName: string;
}): string =>
  `<div class="content">
    <h1>${title}</h1>
    <p>Dear, ${displayName}</P>
    <p>A password reset has been initiated for your account.</p>
    <p>Your password has been reset, and all sessions have been terminated.
    To regain access to the ${APP_NAME}, please set a new password using the link provided.</p>
    <br>
    <p>If you believe this was a mistake, contact the ${APP_NAME} support team immediately.</p>
</div>`;

export const instructionForSetNewPassword = ({
  title,
  displayName,
}: {
  title: string;
  displayName: string;
}): string => commonTemplate({
  head,
  title,
  content: content({
    title,
    displayName,
  }),
});