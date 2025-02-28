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
} from '@nestjs/common';
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
  constructor(private readonly saleService: SaleService) {}

  @Roles(RoleEnum.SUPERADMIN, RoleEnum.USER)
  @Post()
  @ApiOperation({ summary: 'Create a new sale' })
  @ApiBody({ type: CreateSaleDto })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cart not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  create(@Body() createSaleDto: CreateSaleDto) {
    return this.saleService.create(createSaleDto);
  }

  @Roles(RoleEnum.SUPERADMIN)
  @Get()
  @ApiOperation({ summary: 'Find all sales' })
  findAll(@Query() pagination: PaginationArgs) {
    return this.saleService.findAll(pagination);
  }

  @Roles(RoleEnum.SUPERADMIN)
  @Get(':id')
  @ApiOperation({ summary: 'Find a specific sale' })
  findOne(@Param('id') id: string) {
    return this.saleService.findOne(id);
  }

  @Roles(RoleEnum.SUPERADMIN)
  @Get('/user/:id')
  @ApiOperation({ summary: 'Find all sales by an user' })
  findAllByUser(@Param('id') id: string) {
    return this.saleService.findAllByUser(id);
  }
}
