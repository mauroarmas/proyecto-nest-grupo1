import { Module } from '@nestjs/common';
import { SaleService } from './sale.service';
import { SaleController } from './sale.controller';
import { ExcelModule } from '../excel/excel.module';
import { PrinterModule } from '../printer/printer.module';
import { MessangingModule } from '../messaging/messaging.module';

@Module({
  imports: [ExcelModule, PrinterModule, MessangingModule],
  controllers: [SaleController],
  providers: [SaleService],
})
export class SaleModule {}
