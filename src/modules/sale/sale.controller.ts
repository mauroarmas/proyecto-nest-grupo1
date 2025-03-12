import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { SaleService } from './sale.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleEnum } from 'src/common/constants';
import { PaginationArgs } from 'src/utils/pagination/pagination.dto';

@ApiTags('Sales')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sale')
export class SaleController {
  constructor(private readonly saleService: SaleService) { }

  @Roles(RoleEnum.SUPERADMIN, RoleEnum.USER)
  @Post()
  @ApiOperation({ summary: 'Create a new sale' })
  @ApiBody({ type: CreateSaleDto })
  @ApiResponse({ status: 201, description: 'Sale created successfully' })
  @ApiResponse({ status: 400, description: 'Cart not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  create(@Body() createSaleDto: CreateSaleDto, @Res() res: Response) {
    return this.saleService.create(createSaleDto, res);
  }


  @Roles(RoleEnum.SUPERADMIN)
  @Get()
  @ApiResponse({
    status: 200,
    description: 'Sales found successfully',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiOperation({ summary: 'Find all sales' })
  findAll(@Query() pagination: PaginationArgs) {
    return this.saleService.findAll(pagination);
  }

  @Roles(RoleEnum.SUPERADMIN)
  @Get(':id')
  @ApiOperation({ summary: 'Search for a sale by ID' })
  @ApiResponse({
    status: 200,
    description: 'Sale found successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Sale not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  findOne(@Param('id') id: string) {
    return this.saleService.findOne(id);
  }

  @Roles(RoleEnum.SUPERADMIN, RoleEnum.USER)
  @Get('/user/:id')
  @ApiOperation({ summary: 'Find all sales by an user' })
  @ApiResponse({
    status: 200,
    description: 'Sales found successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  findAllByUser(@Param('id') id: string) {
    return this.saleService.findAllByUser(id);
  }

  @Roles(RoleEnum.SUPERADMIN)
  @Get('/export/excel')
  @ApiOperation({ summary: 'Find all sales excel' })
  @ApiResponse({
    status: 200,
    description: 'Sales found successfully',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  findAllExcel(@Res() res: Response) {
    return this.saleService.findAllExcel(res);
  }

  @Roles(RoleEnum.SUPERADMIN)
  @Get('pdf/incomes-pdf')
  async getIncomes(
    @Res() res: Response,
    @Query() query: any,
    pagination: PaginationArgs,
  ): Promise<void> {
    try {
      const pagination: PaginationArgs = {
        startDate: query.startDate || undefined,
        endDate: query.endDate || undefined,
        date: query.date || undefined,
        search: query.search || undefined,
        page: query.page || 1,
        perPage: query.perPage || 10,
      };
      const pdfBuffer = await this.saleService.incomesByDatePDF(pagination);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="incomes-report.pdf"',
        'Content-Length': pdfBuffer.length.toString(),
      });
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).send('Error al generar el PDF');
    }
  }

  @Roles(RoleEnum.SUPERADMIN)
  @Get('pdf/:id')
  @ApiOperation({ summary: 'Generate a PDF of a sale' })
  @ApiResponse({
    status: 200,
    description: 'PDF generated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Sale not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  generatePDF(@Param('id') id: string, @Res() res: Response) {
    return this.saleService.getBill(id, res);
  }

}
