import { Controller, Post, Body, Get, Delete, Param, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleEnum } from 'src/common/constants';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@UseGuards(JwtAuthGuard)
@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Roles(RoleEnum.USER)
  @Post()
  createCart(@Body() createCartDto: CreateCartDto) {
    return this.cartService.createCart(createCartDto);
  }

  @Get('/:userId')
  getCartsByUser(@Param('userId') userId: string) {
    return this.cartService.getCartsByUser(userId);
  }

  @Delete('/:cartId')
  deleteCart(@Param('cartId') cartId: string) {
    return this.cartService.deleteCart(cartId);
  }

  @Get('/pending-carts')
  getPendingCarts() {
    return this.cartService.getPendingCarts();
  }
}
