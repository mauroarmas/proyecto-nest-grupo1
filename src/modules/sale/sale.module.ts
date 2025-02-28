import { Module } from '@nestjs/common';
import { SaleService } from './sale.service';
import { SaleController } from './sale.controller';
import { ExcelModule } from '../excel/excel.module';

@Module({
  imports: [ExcelModule],
  controllers: [SaleController],
  providers: [SaleService],
})
export class SaleModule {}
