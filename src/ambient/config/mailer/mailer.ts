import { IS_PRODUCTION } from '@constants/env';
import { MailerOptions } from '@nestjs-modules/mailer';

export const getMailerConfig = (): MailerOptions => {
  const user = process.env.MAILER_USER ?? '';
  const isTlsDisabled = process.env.MAILER_IS_TLS_DISABLED === 'true';

  const prodTransport = {
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
  };

  const devTransport = {
    host: 'localhost',
    port: Number(process.env.PREVIEW_SMTP_PORT) ?? 1025,
    ignoreTLS: true,
    secure: false,
  };

  return {
    transport: IS_PRODUCTION ? prodTransport : devTransport,
    defaults: {
      from: `"No Reply" <${user}>`,
    },
    preview: true,
  };
};
