import { resolve } from 'path';

import { MailerOptions } from '@nestjs-modules/mailer';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';

export const getMailerConfig = (): MailerOptions => {
  const user = process.env.MAILER_USER ?? '';
  const isTlsDisabled = process.env.MAILER_IS_TLS_DISABLED === 'true';

  return {
    transport: {
      service: process.env.MAILER_SERVICE ?? 'gmail',
      auth: {
        user,
        pass: process.env.MAILER_PASS ?? '',
      },
      ...(isTlsDisabled ? {
        tls: {
          rejectUnauthorized: false,
        }
      } : {}),
    },
    defaults: {
      from: `"No Reply" <${user}>`,
    },
    template: {
      adapter: new PugAdapter(),
      dir: resolve(process.cwd(), './src/domain/mail'),
      options: {
        strict: true,
      },
    },
  };
};
