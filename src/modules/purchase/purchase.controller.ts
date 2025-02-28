import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { PaginationArgs } from 'src/utils/pagination/pagination.dto';
import { ApiBody, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleEnum } from 'src/common/constants';

@ApiTags('Purchase')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.SUPERADMIN)
@Controller('purchase')
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new purchase' })
  @ApiBody({ type: CreatePurchaseDto })
  @ApiResponse({
    status: 201,
    description: 'Purchase created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data in the request',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  create(@Body() createPurchaseDto: CreatePurchaseDto) {
    return this.purchaseService.create(createPurchaseDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all purchase' })
  @ApiResponse({
    status: 200,
    description: 'Purchases found successfully',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  findAll(@Query() pagination: PaginationArgs) {
    return this.purchaseService.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Search for a purchase by ID' })
  @ApiResponse({
    status: 200,
    description: 'Purchase found successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Purchase not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  findOne(@Param('id') id: string) {
    return this.purchaseService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a purchase by ID' })
  @ApiResponse({
    status: 200,
    description: 'Purchase deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Purchase not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  remove(@Param('id') id: string) {
    return this.purchaseService.remove(id);
  }
}
