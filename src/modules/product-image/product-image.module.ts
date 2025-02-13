import { Module } from '@nestjs/common';
import { ProductImageService } from './product-image.service';
import { ProductImageController } from './product-image.controller';

@Module({
  controllers: [ProductImageController],
  providers: [ProductImageService],
})
export class ProductImageModule {}
