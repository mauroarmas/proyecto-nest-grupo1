import { Injectable } from '@nestjs/common';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PurchaseService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createPurchaseDto: CreatePurchaseDto) {
    try {
      const { purchaseLines } = createPurchaseDto;
      const userId = createPurchaseDto.userId;
      const supplierId = createPurchaseDto.supplierId;
      let total = 0;
      let productsPrices = [];

      const supplier = await this.prisma.supplier.findUnique({
        where: { id: supplierId, isDeleted: false },
      })

      //Verificacion de existencia y stock de productos
      for (const line of purchaseLines) {
        const product = await this.prisma.product.findUnique({
          where: { id: line.productId, isDeleted: false },
        });
        if (!product || product.isDeleted) {
          throw new Error(
            `Producto con ID ${line.productId} no encontrado o eliminado`,
          );
        }

        total += product.price * line.quantity;
        productsPrices.push(product.price);
      }

      await this.prisma.purchase.create({
        data: {
          userId,
          total,
          supplierId,
          purchaseLines: {
            create: purchaseLines.map((line, index) => ({
              productId: line.productId,
              quantity: line.quantity,
              subtotal: productsPrices[index] * line.quantity,
            })),
          },
        },
        include: {
          purchaseLines: {
            include: { product: true },
          },
        },
      });

      for (const line of purchaseLines) {
        await this.prisma.product.update({
          where: { id: line.productId },
          data: { stock: { increment: line.quantity } },
        });
      }

      return { message: 'Compra creada con éxito' };
    } catch (error) {
      return { message: 'Error al crear la compra', error: error.message };
    }
  }

  findAll() {
    return this.prisma.purchase.findMany({ include: { purchaseLines: { include: { product: true } } } });
  }

  findOne(id: string) {
    return this.prisma.purchase.findUnique({
      where: { id }, include: { purchaseLines: { include: { product: true } } }
    });
  }

  remove(id: string) {
    return this.prisma.purchase.delete({ where: { id } });
  }
}
