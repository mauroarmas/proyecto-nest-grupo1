import { Module } from '@nestjs/common';
import { ChartModule } from '../chart/chart.module';
import { MercadopagoModule } from '../mercado-pago/mercadopago.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
    imports: [ChartModule, MercadopagoModule],
    controllers: [PaymentController],
    providers: [PaymentService],
    exports: [PaymentService],
})
export class PaymentModule { }