import {
  Controller,
  Post,
  Body,
  Param,
  UseInterceptors,
  UploadedFiles,
  UseFilters,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ImgProductsService } from './img-products.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MulterExceptionFilter } from 'src/common/filters/multer-exception.filter';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleEnum } from 'src/common/constants';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.SUPERADMIN)
@Controller('img-products')
export class ImgProductsController {
  constructor(private readonly imgProductsService: ImgProductsService) { }

  @ApiOperation({ summary: 'Upload image product' })
  @ApiResponse({ status: 200, description: 'Image product uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
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

  @ApiOperation({ summary: 'Delete image product' })
  @ApiResponse({ status: 200, description: 'Image product deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Image product not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Delete(':id')
  async remove(@Param('id') imageId: string) {
    return await this.imgProductsService.remove(imageId);
  }
}
