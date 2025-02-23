import { Module } from '@nestjs/common';
import { ImgProductsService } from './img-products.service';
import { ImgProductsController } from './img-products.controller';

@Module({
  controllers: [ImgProductsController],
  providers: [ImgProductsService],
})
export class ImgProductsModule {}
