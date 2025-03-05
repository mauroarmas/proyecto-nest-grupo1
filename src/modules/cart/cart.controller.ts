import { Controller, Post, Body, Get, Delete, Param, UseGuards, Req } from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleEnum } from 'src/common/constants';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Roles(RoleEnum.USER)
  @Post()
  createCart(
    @Body() createCartDto: CreateCartDto,
    @Req() req: any
  ) {
    const { userId } = req.user;
    return this.cartService.createCart(createCartDto, userId);
  }

  @Roles(RoleEnum.USER)

  @Get()
  getMyCarts(@Req() req: any) {
    const { userId } = req.user;
    return this.cartService.getCartsByUser(userId);
  }

  @Roles(RoleEnum.USER)
  @Delete('/:cartId')
  deleteCart(
    @Req() req: any,
    @Param('cartId') cartId: string
  ) {
    const { userId } = req.user;
    return this.cartService.deleteCart(cartId, userId);
  }

  @Roles(RoleEnum.SUPERADMIN)

  @Get('/pending-carts')
  getPendingCarts() {
    return this.cartService.getPendingCarts();
  }
}