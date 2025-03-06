import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ExcelModule } from '../excel/excel.module';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { ChartModule } from '../chart/chart.module';
import { PrinterModule } from '../printer/printer.module';

@Module({
  imports: [ExcelModule, SuppliersModule, ChartModule, PrinterModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
