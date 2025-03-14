import { Inject, Injectable } from '@nestjs/common';
import { EMAIL_PROVIDER, EmailService } from './messaging.types';

@Injectable()
export class MessagingService {
  constructor(@Inject(EMAIL_PROVIDER) private emailService: EmailService) { }

  async sendRegisterUserEmail(input: { from: string; to: string }) {
    const { from, to } = input;
    const subject = 'Bienvenido a la plataforma';
    const body = `Gracias por registrarte en nuestra plataforma.`;

    await this.emailService.send({
      from,
      to,
      subject,
      body,
    });
  }

  async sendRecoveryPassword(input: { from: string; to: string; url: string }) {
    const { from, to, url } = input;
    const subject = 'Cambio de contraseña';
    const body = `Para cambiar la contraseña utilice esta url ${url}.`;

    await this.emailService.send({
      from,
      to,
      subject,
      body,
    });
  }

  async sendCartPendingEmail(input: { from: string; to: string }) {
    const { from, to } = input;
    const subject = 'Carrito pendiente';
    const body = 'El carrito está pendiente';

    await this.emailService.send({ from, to, subject, body });
  }

  async sendPaymentLink(input: { from: string; to: string; link: string }) {
    const { from, to, link } = input;
    const subject = 'Gracias por confirmar su compra';
    const body = 'Por favor acceda al siguiente link para completar su compra: ' + link;


    await this.emailService.send({ from, to, subject, body });
  }

  async sendBillSale(input: { from: string; to: string; subject: string; body: string; attachments: any[] }) {
    const { from, to, subject, body, attachments } = input;

    await this.emailService.send({
      from,
      to,
      subject,
      body,
      attachments,
    });
  }
}
