import { Logger } from 'winston';

import { Resources } from '@constants/resources';
import { Inject, Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class Mailer {
  constructor(
    private readonly mailerService: MailerService,
    @Inject(Resources.LOGGER) private readonly logger: Logger,
  ) { }

  public async sendConfirmEmail({
    email,
  }: {
    email: string;
  }): Promise<void> {
    this.sendEmail({
      email,
      template: 'confirm-email',
      subject: 'Confirm what you sweet bun',
      context: {
        title: 'Confirm what you very sweet bun! <3',
        welcome: `Hello, ${email}!`
      },
    });
  }

  private async sendEmail({
    email,
    template,
    subject,
    context,
  }: {
    email: string;
    template: string;
    subject: string;
    context: Record<string, string>;
  }): Promise<void> {
    try {
      const result = await this.mailerService.sendMail({
        to: email,
        template,
        subject,
        context,
      });

      this.logger.info('Mailer sendConfirmEmail', {
        email,
        ...result,
      });
    } catch (e) {
      this.logger.error('Mailer sendConfirmEmail', e);
    }
  }
}