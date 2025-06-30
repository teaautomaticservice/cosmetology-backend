import { Logger } from 'winston';

import { Resources } from '@constants/resources';
import { Inject, Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

import { confirmEmail } from './templates/confirmEmail';

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
      subject: 'Confirm what you sweet bun',
      html: confirmEmail({
        title: 'Confirm what you sweet bun',
        welcome: 'Confirm what you sweet bun'
      })
    });
  }

  private async sendEmail({
    email,
    subject,
    html,
  }: {
    email: string;
    subject: string;
    html: string;
  }): Promise<void> {
    try {
      const result = await this.mailerService.sendMail({
        to: email,
        subject,
        html,
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