import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MessangingModule } from '../messaging/messaging.module'; 
import { ScheduleModule } from '@nestjs/schedule';

@Module({
    controllers: [CartController],
    providers: [CartService],
    exports: [CartService],
    imports: [PrismaModule, MessangingModule, ScheduleModule.forRoot()],
})
export class CartModule {}
