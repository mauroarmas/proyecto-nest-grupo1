import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ExcelModule } from '../excel/excel.module';
import { SuppliersModule } from '../suppliers/suppliers.module';

@Module({
  imports: [ExcelModule, SuppliersModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
