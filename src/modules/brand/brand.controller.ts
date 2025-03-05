import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { ApiBody, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleEnum } from 'src/common/constants';
import { Role } from '@prisma/client';


@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Brand')
@Controller('brand')
export class BrandController {
  constructor(private readonly brandService: BrandService) { }

  @Roles(RoleEnum.SUPERADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a new brand' })
  @ApiBody({ type: CreateBrandDto })
  @ApiResponse({
    status: 201,
    description: 'Brand created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data in the request',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  create(@Body() createBrandDto: CreateBrandDto) {
    return this.brandService.create(createBrandDto);
  }

  @Roles(RoleEnum.SUPERADMIN, RoleEnum.USER)
  @Get()
  @ApiOperation({ summary: 'List all brands' })
  @ApiBody({ type: CreateBrandDto })
  @ApiResponse({
    status: 200,
    description: 'Brands found successfully',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  findAll() {
    return this.brandService.findAll();
  }

  @Roles(RoleEnum.SUPERADMIN, RoleEnum.USER)
  @Get(':id')
  @ApiOperation({ summary: 'Search for a brand by ID' })
  @ApiBody({ type: CreateBrandDto })
  @ApiResponse({
    status: 200,
    description: 'Brand found successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Brand not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  findOne(@Param('id') id: string) {
    return this.brandService.findOne(id);
  }

  @Roles(RoleEnum.SUPERADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a brand' })
  @ApiBody({ type: UpdateBrandDto })
  @ApiResponse({
    status: 200,
    description: 'Brand updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Brand not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data in the request',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  update(@Param('id') id: string, @Body() updateBrandDto: UpdateBrandDto) {
    return this.brandService.update(id, updateBrandDto);
  }

  @Roles(RoleEnum.SUPERADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a brand' })
  @ApiResponse({
    status: 200,
    description: 'Brand deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Brand not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  remove(@Param('id') id: string) {
    return this.brandService.remove(id);
  }
}
