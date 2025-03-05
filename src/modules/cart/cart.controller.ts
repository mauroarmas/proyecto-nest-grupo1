import { Controller, Post, Body, Get, Delete, Param, UseGuards, Req } from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Create a new cart or add products to an existing cart' })
  @ApiBody({ type: CreateCartDto })
  @ApiResponse({
    status: 201,
    description: 'Cart created or updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data in the request or insufficient stock',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  createCart(
    @Body() createCartDto: CreateCartDto,
    @Req() req: any
  ) {
    const { userId } = req.user;
    return this.cartService.createCart(createCartDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user carts' })
  @ApiResponse({
    status: 200,
    description: 'Carts found successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  getMyCarts(@Req() req: any) {
    const { userId } = req.user;
    return this.cartService.getCartsByUser(userId);
  }

  @Delete('/:cartId')
  @ApiOperation({ summary: 'Delete a specific cart' })
  @ApiResponse({
    status: 200,
    description: 'Cart deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Cart not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  deleteCart(
    @Req() req: any,
    @Param('cartId') cartId: string
  ) {
    const { userId } = req.user;
    return this.cartService.deleteCart(cartId, userId);
  }

  @Roles(RoleEnum.SUPERADMIN)
  @Get('/pending-carts')
  @ApiOperation({ summary: 'Get all pending carts (Only admin)' })
  @ApiResponse({
    status: 200,
    description: 'Pending carts found successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - You do not have the necessary permissions',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  getPendingCarts() {
    return this.cartService.getPendingCarts();
  }
}
