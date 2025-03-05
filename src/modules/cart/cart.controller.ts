import { Controller, Post, Body, Get, Delete, Param, UseGuards, Req } from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Create a new cart' })
  @ApiBody({ type: CreateCartDto })
  @ApiResponse({ status: 201, description: 'Cart created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  createCart(
    @Body() createCartDto: CreateCartDto,
    @Req() req: any
  ) {
    const { userId } = req.user;
    return this.cartService.createCart(createCartDto, userId);
  }

  @Roles(RoleEnum.USER)
  @Get()
  @ApiOperation({ summary: 'Get all carts by user' })
  @ApiResponse({ status: 200, description: 'Carts retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Carts not found' })
  getMyCarts(@Req() req: any) {
    const { userId } = req.user;
    return this.cartService.getCartsByUser(userId);
  }

  @Roles(RoleEnum.USER)
  @Delete('/:cartId')
  @ApiOperation({ summary: 'Delete a cart by user' })
  @ApiResponse({ status: 200, description: 'Cart deleted successfully' })
  @ApiResponse({ status: 404, description: 'Cart not found' })
  deleteCart(
    @Req() req: any,
    @Param('cartId') cartId: string
  ) {
    const { userId } = req.user;
    return this.cartService.deleteCart(cartId, userId);
  }

  @Roles(RoleEnum.SUPERADMIN)
  @ApiOperation({ summary: 'Get all pending carts' }) 
  @ApiResponse({ status: 200, description: 'Pending carts retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Pending carts not found' })
  @Get('/pending-carts')
  getPendingCarts() {
    return this.cartService.getPendingCarts();
  }
}