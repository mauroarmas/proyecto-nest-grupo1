import {
  Controller,
  Post,
  Body,
  Param,
  UseInterceptors,
  UploadedFiles,
  UseFilters,
  BadRequestException,
} from '@nestjs/common';
import { ImgProductsService } from './img-products.service';
import { CreateImgProductDto } from './dto/create-img-product.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MulterExceptionFilter } from 'src/common/filters/multer-exception.filter';

@Controller('img-products')
export class ImgProductsController {
  constructor(private readonly imgProductsService: ImgProductsService) {}

  @Post('upload/:productId')
  @UseInterceptors(
    FilesInterceptor('files', 5),
  )
  @UseFilters(MulterExceptionFilter)
  async uploadImgProduct(
    @UploadedFiles() files: Express.Multer.File[],
    @Param('productId') productId: string,
  ) {
    return await this.imgProductsService.uploadImgProduct(
      files,
      productId,
    );
  }
}
