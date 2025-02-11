import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from 'src/config/env-validation.config';
import { PrismaModule } from '../prisma/prisma.module';
import { PurchaseModule } from '../purchase/purchase.module';
import { SuppliersModule } from '../suppliers/suppliers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      validationSchema: envValidationSchema
    }),
    PrismaModule,
    PurchaseModule,
    SuppliersModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
