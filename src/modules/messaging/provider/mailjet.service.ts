import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'node-mailjet';
import { Email, EmailService } from '../messaging.types';
import { getMessagingConfig } from 'src/common/constants';

@Injectable()
export class MailjetService implements EmailService {
  private logger = new Logger(MailjetService.name);
  private client: Client;

  constructor(private configService: ConfigService) {
    const messagingConfig = getMessagingConfig(this.configService);
    
    this.logger.debug(`API Key: ${messagingConfig.apiKey}`);
    this.logger.debug(`Secret: ${messagingConfig.secret}`);
    
    if (!messagingConfig.apiKey || !messagingConfig.secret) {
      throw new Error('Mailjet credentials are not configured properly');
    }

    this.client = new Client({
      apiKey: messagingConfig.apiKey,
      apiSecret: messagingConfig.secret,
      config: {
        version: 'v3.1',
      },
    });
  }
  async send(input: Email) {
    const { from, to, subject, body, attachments } = input;
    await this.client
      .post('send')
      .request({
        Messages: [
          {
            From: {
              Email: from,
            },
            To: [
              {
                Email: to,
              },
            ],
            Subject: subject,
            HTMLPart: body,
            Attachments: attachments
              ? attachments.map((attachment) => ({
                  ContentType: 'application/pdf',
                  Filename: attachment.filename,
                  Base64Content: Buffer.from(attachment.content).toString('base64'),
              }))
              : [],
              
          },
        ],
      })
      .then(() => {
        this.logger.debug(`Email sent to ${to}`);
      })
      .catch((err) => {
        this.logger.error('Error sending email', err.stack);
      });
  }
}
