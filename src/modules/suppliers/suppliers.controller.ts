import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Res,
} from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleEnum } from 'src/common/constants';
import { PaginationArgs } from 'src/utils/pagination/pagination.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.SUPERADMIN)
@ApiTags('Suppliers')
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new supplier' })
  @ApiBody({ type: CreateSupplierDto })
  @ApiResponse({
    status: 201,
    description: 'Supplier created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data in the request',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  create(@Body() createSupplierDto: CreateSupplierDto) {
    return this.suppliersService.create(createSupplierDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all suppliers' })
  @ApiBody({ type: CreateSupplierDto })
  @ApiResponse({
    status: 200,
    description: 'Suppliers found successfully',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  findAll(@Query() pagination: PaginationArgs) {
    return this.suppliersService.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Search for a supplier by ID' })
  @ApiBody({ type: CreateSupplierDto })
  @ApiResponse({
    status: 200,
    description: 'Supplier found successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Supplier not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  findOne(@Param('id') id: string) {
    return this.suppliersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a supplier by ID' })
  @ApiBody({ type: UpdateSupplierDto })
  @ApiResponse({
    status: 200,
    description: 'Supplier updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Supplier not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async update(
    @Param('id') id: string,
    @Body() updateSupplierDto: UpdateSupplierDto,
  ) {
    return await this.suppliersService.update(id, updateSupplierDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a supplier by ID' })
  @ApiResponse({
    status: 200,
    description: 'Supplier deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Supplier not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  remove(@Param('id') id: string) {
    return this.suppliersService.remove(id);
  }

  @Roles(RoleEnum.SUPERADMIN)
  @Get('/export/excel')
  @ApiOperation({ summary: 'Find all suppliers excel' })
  @ApiResponse({
    status: 200,
    description: 'Suppliers found successfully',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  findAllExcel(@Res() res: Response) {
    return this.suppliersService.findAllExcel(res);
  }
}
