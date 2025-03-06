import { Module, Provider } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { EMAIL_PROVIDER } from './messaging.types';
import { MailjetService } from './provider/mailjet.service';

const mailServicePrivider: Provider = {
  provide: EMAIL_PROVIDER,
  useClass: MailjetService,
};
@Module({
  providers: [MessagingService, mailServicePrivider],
  exports: [MessagingService],
})
export class MessangingModule { }
