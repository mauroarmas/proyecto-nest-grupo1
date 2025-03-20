import { Body, Controller, Delete, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ApiTags } from '@nestjs/swagger';
import { DiscountService } from './discount.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleEnum } from 'src/common/constants';
import { CreateDiscountDto } from './dto/create-discount';

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Discount')
@Controller('discount')
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  @Roles(RoleEnum.SUPERADMIN)
  @Post()
  create(@Body() createDiscountDto: CreateDiscountDto) {
    return this.discountService.create(createDiscountDto);
  }

  @Roles(RoleEnum.SUPERADMIN)
  @Delete(':id')
  async deleteDiscount(
    @Param('id') 
    id: string
  ) {
    return this.discountService.deleteDiscount(id);
  }
}