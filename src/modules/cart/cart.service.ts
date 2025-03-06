import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MessagingService } from '../messaging/messaging.service';
import { getMessagingConfig } from 'src/common/constants';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CartService {
    constructor(private readonly prisma: PrismaService,
        private readonly messagingService: MessagingService,
        private configService: ConfigService) { }

    async createCart(createCartDto: CreateCartDto, userId: string) {
        const { cartLines } = createCartDto;

        const activeCart = await this.prisma.cart.findFirst({
            where: {
                userId,
                isDeleted: false,
                status: 'pending'
            },
            include: {
                cartLines: true
            }
        });

        const products = await this.prisma.product.findMany({
            where: {
                id: { in: cartLines.map((cartLine) => cartLine.productId) },
            },
        });

        const missingProducts = cartLines.filter((cartLine) =>
            !products.some((product) => product.id === cartLine.productId)
        );

        if (missingProducts.length > 0) {
            throw new BadRequestException(`Productos no encontrados: ${missingProducts.map(p => p.productId).join(', ')}`);
        }

        const stockErrors = cartLines.map((cartLine) => {
            const product = products.find((p) => p.id === cartLine.productId);
            if (product.stock < cartLine.quantity) {
                return {
                    productId: cartLine.productId,
                    productName: product.name,
                    requestedQuantity: cartLine.quantity,
                    availableStock: product.stock
                };
            }
            return null;
        }).filter(error => error !== null);

        if (stockErrors.length > 0) {
            const errorMessages = stockErrors.map(error =>
                `El producto "${error.productName}" (ID: ${error.productId}) solo tiene ${error.availableStock} unidades disponibles y estás solicitando ${error.requestedQuantity}`
            );
            throw new BadRequestException({
                message: 'Error de stock insuficiente',
                details: errorMessages
            });
        }

        if (activeCart) {
            return await this.prisma.$transaction(async (prisma) => {
                for (const cartLine of cartLines) {
                    const product = products.find(p => p.id === cartLine.productId);
                    const existingLine = activeCart.cartLines.find(
                        line => line.productId === cartLine.productId
                    );

                    const totalQuantity = existingLine
                        ? existingLine.quantity + cartLine.quantity
                        : cartLine.quantity;

                    if (product.stock < totalQuantity) {
                        throw new BadRequestException(
                            `No hay suficiente stock para el producto "${product.name}". ` +
                            `Stock disponible: ${product.stock}, Cantidad total solicitada: ${totalQuantity}`
                        );
                    }

                    if (existingLine) {
                        await prisma.cartLine.update({
                            where: { id: existingLine.id },
                            data: {
                                quantity: totalQuantity,
                                subtotal: totalQuantity * product.price
                            }
                        });
                    } else {
                        await prisma.cartLine.create({
                            data: {
                                cartId: activeCart.id,
                                productId: cartLine.productId,
                                quantity: cartLine.quantity,
                                subtotal: cartLine.quantity * product.price
                            }
                        });
                    }

                    await prisma.product.update({
                        where: { id: cartLine.productId },
                        data: {
                            stock: {
                                decrement: cartLine.quantity
                            }
                        }
                    });
                }

                const updatedCartLines = await prisma.cartLine.findMany({
                    where: { cartId: activeCart.id }
                });

                const newTotal = updatedCartLines.reduce((acc, line) => acc + line.subtotal, 0);

                return await prisma.cart.update({
                    where: { id: activeCart.id },
                    data: { total: newTotal },
                    include: {
                        cartLines: {
                            include: {
                                product: true
                            }
                        }
                    }
                });
            });
        }

        return await this.prisma.$transaction(async (prisma) => {
            const newCart = await prisma.cart.create({
                data: {
                    userId,
                    status: "pending",
                    total: cartLines.reduce((acc, cartLine) =>
                        acc + cartLine.quantity * products.find(
                            (product) => product.id === cartLine.productId
                        ).price, 0
                    ),
                    cartLines: {
                        create: cartLines.map((cartLine) => ({
                            productId: cartLine.productId,
                            quantity: cartLine.quantity,
                            subtotal: cartLine.quantity * products.find(
                                (product) => product.id === cartLine.productId
                            ).price,
                        })),
                    },
                },
                include: {
                    cartLines: {
                        include: {
                            product: true
                        }
                    }
                }
            });

            for (const cartLine of cartLines) {
                await prisma.product.update({
                    where: { id: cartLine.productId },
                    data: {
                        stock: {
                            decrement: cartLine.quantity
                        }
                    }
                });
            }

            return newCart;
        });
    }

    @Cron(CronExpression.EVERY_2_HOURS)
    async checkStatus() {
        try {
            const carts = await this.prisma.cart.findMany({
                where: {
                    status: "pending",
                    isDeleted: false,
                    notifiedAt: null
                },
                include: {
                    user: true
                }
            });


            if (carts.length === 0) {
                return [];
            }

            await Promise.all(carts.map(async (cart) => {
                try {
                    if (cart.user?.email) {
                        const messagingConfig = getMessagingConfig(this.configService);
                        await this.messagingService.sendCartPendingEmail({
                            from: messagingConfig.emailSender,
                            to: cart.user.email,
                        });

                        await this.prisma.cart.update({
                            where: { id: cart.id },
                            data: {
                                notifiedAt: new Date()
                            }
                        });
                    }
                } catch (error) {
                    console.error(`Error enviando email para el carrito ${cart.id}:`, error);
                }
            }));

            return carts;
        } catch (error) {
            console.error('Error en checkStatus:', error);
            throw error;
        }
    }

    @Cron(CronExpression.EVERY_3_HOURS)
    async cancelExpiredCarts() {
        try {
            const expiredCarts = await this.prisma.cart.findMany({
                where: {
                    status: 'pending',
                    notifiedAt: {
                        lt: new Date(Date.now() - 1 * 60 * 60 * 1000)
                    },
                    isDeleted: false
                },
                include: {
                    cartLines: true
                }
            });

            for (const cart of expiredCarts) {
                await this.prisma.$transaction(async (prisma) => {
                    for (const line of cart.cartLines) {
                        await prisma.product.update({
                            where: { id: line.productId },
                            data: {
                                stock: {
                                    increment: line.quantity
                                }
                            }
                        });
                    }

                    await prisma.cart.update({
                        where: { id: cart.id },
                        data: {
                            status: 'cancelled',
                            isDeleted: true
                        }
                    });
                });
            }

            return expiredCarts;
        } catch (error) {
            console.error('Error cancelando carritos expirados:', error);
            throw error;
        }
    }

    async getCartsByUser(userId: string) {
        const carts = await this.prisma.cart.findMany({
            where: {
                userId,
                status: 'pending',
                isDeleted: false
            },
            include: {
                cartLines: {
                    include: {
                        product: true
                    }
                }
            }
        });

        return carts;
    }

    async deleteCart(cartId: string, userId: string) {
        const cart = await this.prisma.cart.findUnique({
            where: { id: cartId },
            include: { cartLines: true }
        });

        if (!cart) {
            throw new NotFoundException('Carrito no encontrado');
        }

        if (cart.userId !== userId) {
            throw new UnauthorizedException('No tienes permiso para eliminar este carrito');
        }

        const updatedCart = await this.prisma.cart.update({
            where: { id: cartId },
            data: { isDeleted: true, status: 'cancelled' }
        });

        for (const line of cart.cartLines) {
            await this.prisma.product.update({
                where: { id: line.productId },
                data: { stock: { increment: line.quantity } }
            });
        }

        return updatedCart;
    }

    async getPendingCarts() {
        const carts = await this.prisma.cart.findMany({
            where: { status: 'pending', isDeleted: false }
        });

        return carts;
    }
}
