import { Module } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { PurchaseController } from './purchase.controller';
import { ExcelModule } from '../excel/excel.module';

@Module({
  imports: [ExcelModule],
  controllers: [PurchaseController],
  providers: [PurchaseService],
})
export class PurchaseModule {}
