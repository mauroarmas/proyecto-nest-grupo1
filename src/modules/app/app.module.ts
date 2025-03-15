import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from 'src/config/env-validation.config';
import { PurchaseModule } from '../purchase/purchase.module';
import { SuppliersModule } from '../suppliers/suppliers.module';
import i18nModuleConfig from 'src/config/i18n.config';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ProductsModule } from '../products/products.module';
import { CategoriesModule } from '../categories/categories.module';
import { ImgProductsModule } from '../img-products/img-products.module';
import { CartModule } from '../cart/cart.module';
import { BrandModule } from '../brand/brand.module';
import { MessangingModule } from '../messaging/messaging.module';
import { SaleModule } from '../sale/sale.module';
import { ChartModule } from '../chart/chart.module';
import { PaymentModule } from '../payment/payment.module';
import { DiscountModule } from '../discount/discount.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      validationSchema: envValidationSchema
    }),
    PurchaseModule,
    i18nModuleConfig(),
    PrismaModule,
    PurchaseModule,
    SuppliersModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    ImgProductsModule,
    CartModule,
    BrandModule,
    MessangingModule,
    SaleModule,
    ChartModule,
    PaymentModule,
    DiscountModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
