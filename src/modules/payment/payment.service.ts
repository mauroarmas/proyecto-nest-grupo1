import { BadRequestException, Injectable, Res } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MercadopagoService } from '../mercado-pago/mercadopago.service';
import { I18nService } from 'nestjs-i18n';
import { SaleService } from '../sale/sale.service';
import { Response } from 'express';


@Injectable()
export class PaymentService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly mercadopagoService: MercadopagoService,
        private readonly i18n: I18nService,
        private readonly saleService: SaleService
    ) { }

    async mercadopagoWebhook(event: any, res: Response ) {
        try {
            if (event.type === 'payment') {
                const paymentId = event.data.id;
                const payment = await this.mercadopagoService.getPayment(paymentId);
                if (payment.status === 'approved') {
                    const cartId = payment.metadata.cart_id;
                    const cart = await this.prisma.cart.findFirst({
                        where: {
                            id: cartId,
                            payment: { status: 'PENDING' },
                        },
                        include: { payment: true },
                    });
                    if (cart) {
                        await this.prisma.payment.update({
                            where: { id: cart.payment.id },
                            data: { status: 'COMPLETED', paymentId },
                        });
                        await this.saleService.create({ cartId }, res);
                        return { message: 'Compra actualizada correctamente' };
                    } else {
                        throw new BadRequestException(this.i18n.translate('messages.invalidNumber'));
                    }
                }
            }
        } catch (error) {
            return { message: 'Error al crear la compra', error: error.message };
        }
    }
}