import { Module } from '@nestjs/common';
import { ImgProductsService } from './img-products.service';
import { ImgProductsController } from './img-products.controller';
import { AwsModule } from '../aws/aws.module';
import { ExcelModule } from '../excel/excel.module';

@Module({
  imports: [AwsModule, ExcelModule],
  controllers: [ImgProductsController],
  providers: [ImgProductsService],
})
export class ImgProductsModule {}
