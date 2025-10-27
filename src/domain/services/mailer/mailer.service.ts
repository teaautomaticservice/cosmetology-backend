import { Logger } from 'winston';

import { APP_NAME } from '@commonConstants/env';
import { Resources } from '@commonConstants/resources';
import { Inject, Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

import { confirmEmailCreatedUserByAdmin } from './templates/confirmEmail';
import { instructionForSetNewPassword } from './templates/instructionForSetNewPassword';

@Injectable()
export class Mailer {
  constructor(
    private readonly mailerService: MailerService,
    @Inject(Resources.LOGGER) private readonly logger: Logger,
  ) { }

  public async sendConfirmEmailCreatedByAdmin({
    email,
    displayName,
    userToken,
  }: {
    displayName: string;
    email: string;
    userToken: string;
  }): Promise<void> {
    const title = `Welcome to ${APP_NAME}!`;
    this.sendEmail({
      email,
      subject: title,
      html: confirmEmailCreatedUserByAdmin({
        title,
        displayName,
        userToken,
      })
    });
  }

  public async sendInstructionsForSetNewPassword({
    email,
    displayName,
  }: {
    email: string;
    displayName: string;
  }): Promise<void> {
    const title = `Restore access to ${APP_NAME}`;
    this.sendEmail({
      email,
      subject: title,
      html: instructionForSetNewPassword({
        title,
        displayName,
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