import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Res, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginationArgs } from 'src/utils/pagination/pagination.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleEnum } from 'src/common/constants';
import { Response } from 'express';


@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Roles(RoleEnum.SUPERADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data in the request',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Roles(RoleEnum.SUPERADMIN, RoleEnum.USER)
  @Get()
  @ApiOperation({ summary: 'List all products' })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({
    status: 200,
    description: 'Products found successfully',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  findAll(@Query() pagination: PaginationArgs) {
    return this.productsService.findAll(pagination);
  }

  @Roles(RoleEnum.SUPERADMIN, RoleEnum.USER)
  @Get(':id')
  @ApiOperation({ summary: 'Search for a product by ID' })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({
    status: 200,
    description: 'Product found successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Roles(RoleEnum.SUPERADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data in the request',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Roles(RoleEnum.SUPERADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({
    status: 204,
    description: 'Product deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Roles(RoleEnum.SUPERADMIN)
  @ApiOperation({ summary: 'Export all products to Excel' })
  @ApiResponse({
    status: 200,
    description: 'Products exported successfully',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @Get('export/excel')
  findAllByProfessionalExcel(@Res() res: Response) {
    return this.productsService.exportAllExcel(res);
  }

  @Roles(RoleEnum.SUPERADMIN)
  @ApiOperation({ summary: 'Upload products from Excel' }) 
  @ApiResponse({
    status: 200,
    description: 'Products uploaded successfully',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @Post('upload/excel')
  @UseInterceptors(FileInterceptor('file'))
  async uploadExcel(@UploadedFile() file: Express.Multer.File) { 
    const data = await this.productsService.uploadExcel(file);
    return { message: 'Productos cargados exitosamente'};
  }

  @Roles(RoleEnum.SUPERADMIN)
  @ApiOperation({ summary: 'Get the best seller products' })
  @ApiResponse({
    status: 200,
    description: 'Best seller products found successfully',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @Get('bestSeller/:quantity')
  getMostPurchasedProducts( @Param('quantity') quantity: number) {
    return this.productsService.getMostPurchasedProducts(quantity);
  }

  @Roles(RoleEnum.SUPERADMIN)
  @ApiOperation({ summary: 'Get the best seller products chart' })
  @ApiResponse({
    status: 200,
    description: 'Best seller products chart generated successfully',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @Get('bestSeller/chart/:quantity')
  async getMostPurchasedProductsChart(@Res()res: Response, @Param('quantity') quantity: number): Promise<void>  {
    const pdfBuffer = await this.productsService.getBestSellerProductsChart(quantity);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="bestSellersSupport.pdf"',
      'Content-Length': pdfBuffer.length.toString(),
    });

    res.send(pdfBuffer);
  }
}