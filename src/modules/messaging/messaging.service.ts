import { Inject, Injectable } from '@nestjs/common';
import { EMAIL_PROVIDER, EmailService } from './messaging.types';

const LOGO_URL = 'https://media.licdn.com/dms/image/v2/D4D0BAQHoJdD42ecpaw/company-logo_200_200/company-logo_200_200/0/1736973039880/vortex_software_logo?e=2147483647&v=beta&t=G3KYC2w4iX84sEJmiv29sDiLNfT9kf8PjMyMWWmQ3Q8'; // Usa una URL pública

@Injectable()
export class MessagingService {
  constructor(@Inject(EMAIL_PROVIDER) private emailService: EmailService) {}

  async sendRegisterUserEmail(input: { from: string; to: string }) {
    const { from, to } = input;
    const subject = '🎉 ¡Bienvenido a Vortex Software! 🚀';

    const body = `
      <div style="font-family: Arial, sans-serif; color: #333; text-align: center; padding: 20px;">
        <img src="${LOGO_URL}" alt="Vortex Software" style="width: 150px; margin-bottom: 20px;">
        <h1 style="color: #0056b3;">¡Bienvenido a nuestra plataforma!</h1>
        <p style="font-size: 16px;">Gracias por registrarte en <b>Vortex Software</b>. Estamos emocionados de tenerte a bordo.</p>
        <p style="font-size: 16px;">Prepárate para una experiencia increíble. Si tienes alguna duda, nuestro equipo está aquí para ayudarte.</p>
        <a href="https://vortexsoftware.com" style="display: inline-block; background-color: #0056b3; color: #fff; padding: 10px 20px; font-size: 16px; text-decoration: none; border-radius: 5px; margin-top: 20px;">Explorar Plataforma</a>
        <p style="margin-top: 20px; font-size: 14px; color: #777;">Si no fuiste tú quien se registró, por favor ignora este correo.</p>
      </div>
    `;

    await this.emailService.send({ from, to, subject, body });
  }

  async sendRecoveryPassword(input: { from: string; to: string; url: string }) {
    const { from, to, url } = input;
    const subject = '🔑 Restablecimiento de contraseña';

    const body = `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
        <img src="${LOGO_URL}" alt="Vortex Software" style="width: 150px; margin-bottom: 20px;">
        <h2 style="color: #d9534f;">¿Olvidaste tu contraseña?</h2>
        <p style="font-size: 16px;">No te preocupes, puedes restablecerla haciendo clic en el siguiente botón:</p>
        <a href="${url}" style="display: inline-block; background-color: #d9534f; color: #fff; padding: 10px 20px; font-size: 16px; text-decoration: none; border-radius: 5px;">Restablecer contraseña</a>
        <p style="margin-top: 20px; font-size: 14px; color: #777;">Si no solicitaste este cambio, ignora este correo.</p>
      </div>
    `;

    await this.emailService.send({ from, to, subject, body });
  }

  async sendCartPendingEmail(input: { from: string; to: string }) {
    const { from, to } = input;
    const subject = '🛒 ¡Tienes productos pendientes en tu carrito!';

    const body = `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
        <img src="${LOGO_URL}" alt="Vortex Software" style="width: 150px; margin-bottom: 20px;">
        <h2 style="color: #f0ad4e;">¡Tu carrito te espera!</h2>
        <p style="font-size: 16px;">Aún tienes productos en tu carrito. No dejes que se escapen. 🎯</p>
      </div>
    `;

    await this.emailService.send({ from, to, subject, body });
  }

  async sendBillSale(input: {
    from: string;
    to: string;
    subject: string;
    attachments: any[];
  }) {
    const { from, to, subject, attachments } = input;
  
    const body = `
      <div style="font-family: Arial, sans-serif; color: #333; text-align: center; padding: 20px;">
        <img src="${LOGO_URL}" alt="Vortex Software" style="width: 150px; margin-bottom: 20px;">
        <h2 style="color: #333;">📄 ¡Aquí tienes tu factura!</h2>
        <p style="font-size: 16px;">Gracias por tu compra en nuestra plataforma. Adjuntamos tu factura en formato PDF.</p>
        <p style="font-size: 16px;">Si tienes alguna consulta, no dudes en contactarnos.</p>
        <p style="margin-top: 20px; font-size: 14px; color: #777;">Este es un correo automático, por favor no respondas a este mensaje.</p>
      </div>
    `;
  
    await this.emailService.send({
      from,
      to,
      subject,
      body,
      attachments,
    });
  }
  
}
