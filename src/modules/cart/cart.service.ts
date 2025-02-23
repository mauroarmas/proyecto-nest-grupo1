import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MessagingService } from '../messaging/messaging.service';
import { messagingConfig } from 'src/common/constants'; 

@Injectable()
export class CartService {
    constructor(private readonly prisma: PrismaService, 
        private readonly messagingService: MessagingService) {}

    async createCart(createCartDto: CreateCartDto) {
        const { userId, cartLines } = createCartDto;

        //verificar si el usuario ya tiene un carrito activo
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

        //verificar productos
        const products = await this.prisma.product.findMany({
            where: {
                id: { in: cartLines.map((cartLine) => cartLine.productId) },
            },
        });

        const missingProducts = cartLines.filter((cartLine) => 
            !products.some((product) => product.id === cartLine.productId)
        );

        if (missingProducts.length > 0) {
            throw new Error(`Productos no encontrados: ${missingProducts.map(p => p.productId).join(', ')}`);
        }

        //verificar stock
        const insufficientStock = cartLines.filter((cartLine) => {
            const product = products.find((p) => p.id === cartLine.productId);
            return product.stock < cartLine.quantity;
        });

        if (insufficientStock.length > 0) {
            throw new Error(`Stock insuficiente para: ${insufficientStock.map(p => p.productId).join(', ')}`);
        }

        //si existe un carrito activo, añadir productos a ese carrito
        if (activeCart) {
            return await this.prisma.$transaction(async (prisma) => {
                for (const cartLine of cartLines) {
                    const product = products.find(p => p.id === cartLine.productId);
                    const existingLine = activeCart.cartLines.find(
                        line => line.productId === cartLine.productId
                    );

                    if (existingLine) {
                        await prisma.cartLine.update({
                            where: { id: existingLine.id },
                            data: {
                                quantity: existingLine.quantity + cartLine.quantity,
                                subtotal: (existingLine.quantity + cartLine.quantity) * product.price
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

                    //actualizar stock
                    await prisma.product.update({
                        where: { id: cartLine.productId },
                        data: {
                            stock: {
                                decrement: cartLine.quantity
                            }
                        }
                    });
                }

                //recalcular total del carrito
                const updatedCartLines = await prisma.cartLine.findMany({
                    where: { cartId: activeCart.id }
                });

                const newTotal = updatedCartLines.reduce((acc, line) => acc + line.subtotal, 0);

                //actualizar carrito
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

        //si no hay carrito activo, crear uno nuevo
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

            //actualizar stock de productos
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

    //verificar si hay carritos pendientes y enviar email
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


            if(carts.length === 0) {
                return [];
            }

            await Promise.all(carts.map(async (cart) => {
                try {
                    if (cart.user?.email) {
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
            //buscar carritos que fueron notificados hace más de 3 horas
            const expiredCarts = await this.prisma.cart.findMany({
                where: {
                    status: 'pending',
                    notifiedAt: {
                        lt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hora
                    },
                    isDeleted: false
                },
                include: {
                    cartLines: true
                }
            });

            for (const cart of expiredCarts) {
                await this.prisma.$transaction(async (prisma) => {
                    //devolver stock 
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

                    //is deleted true y status cancelled
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
            where: { userId, status: 'pending', isDeleted: false }
        });

        return carts;
    }

    async deleteCart(cartId: string) {
        const cart = await this.prisma.cart.update({
            where: { id: cartId },
            data: { isDeleted: true , status: 'cancelled'}
        });

        const cartLines = await this.prisma.cartLine.findMany({
            where: { cartId }
        });

        //devolver stock de productos
        for (const line of cartLines) {
            await this.prisma.product.update({
                where: { id: line.productId },
                data: { stock: { increment: line.quantity } }
            });
        }

        return cart;
    }

    async getPendingCarts() {
        const carts = await this.prisma.cart.findMany({
            where: { status: 'pending', isDeleted: false }
        });

        return carts;
    }
}
