import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MessangingModule } from '../messaging/messaging.module'; 
import { ScheduleModule } from '@nestjs/schedule';
import { MercadopagoModule } from '../mercado-pago/mercadopago.module';

@Module({
    controllers: [CartController],
    providers: [CartService],
    exports: [CartService],
    imports: [PrismaModule, MessangingModule, ScheduleModule.forRoot(), MercadopagoModule],
})
export class CartModule {}
