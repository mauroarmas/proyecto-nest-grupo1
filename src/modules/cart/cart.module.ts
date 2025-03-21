import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MessangingModule } from '../messaging/messaging.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ChartModule } from '../chart/chart.module';
import { PrinterModule } from '../printer/printer.module';
import { MercadopagoModule } from '../mercado-pago/mercadopago.module';
import { DiscountModule } from '../discount/discount.module';

@Module({
    imports: [ChartModule, PrinterModule, MercadopagoModule, PrismaModule, MessangingModule, ScheduleModule.forRoot(), DiscountModule],
    controllers: [CartController],
    providers: [CartService],
    exports: [CartService],
})

export class CartModule { }
