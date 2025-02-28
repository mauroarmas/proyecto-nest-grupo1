import { Controller, Post, Body, Get, Delete, Param, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleEnum } from 'src/common/constants';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Roles(RoleEnum.USER)
  @Post()
  createCart(
    @GetUser() user: User,
    @Body() createCartDto: CreateCartDto
  ) {
    return this.cartService.createCart(createCartDto, user.id);
  }

  @Get()
  getMyCarts(@GetUser() user: User) {
    return this.cartService.getCartsByUser(user.id);
  }

  @Delete('/:cartId')
  deleteCart(
    @GetUser() user: User,
    @Param('cartId') cartId: string
  ) {
    return this.cartService.deleteCart(cartId, user.id);
  }

  @Get('/pending-carts')
  getPendingCarts() {
    return this.cartService.getPendingCarts();
  }
}
