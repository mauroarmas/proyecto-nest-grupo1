import { Module } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { PurchaseController } from './purchase.controller';
import { ExcelModule } from '../excel/excel.module';
import { ChartModule } from '../chart/chart.module';
import { PrinterModule } from '../printer/printer.module';

@Module({
  imports: [ExcelModule, ChartModule, PrinterModule],
  controllers: [PurchaseController],
  providers: [PurchaseService],
})
export class PurchaseModule { }
