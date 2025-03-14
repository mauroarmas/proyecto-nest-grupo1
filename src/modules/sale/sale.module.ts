import { Module } from '@nestjs/common';
import { SaleService } from './sale.service';
import { SaleController } from './sale.controller';
import { ExcelModule } from '../excel/excel.module';
import { PrinterModule } from '../printer/printer.module';
import { MessangingModule } from '../messaging/messaging.module';
import { ChartModule } from '../chart/chart.module';

@Module({
  imports: [ExcelModule, PrinterModule, MessangingModule, ChartModule],
  controllers: [SaleController],
  providers: [SaleService],
  exports: [SaleService],
})
export class SaleModule { }
