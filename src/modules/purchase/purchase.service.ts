import { Injectable } from '@nestjs/common';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { PrismaService } from '../prisma/prisma.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { PaginationArgs } from 'src/utils/pagination/pagination.dto';
import { Prisma } from '@prisma/client';
import { getPaginationFilter } from 'src/utils/pagination/pagination.utils';
import { paginate } from 'src/utils/pagination/parsing';

@Injectable()
export class PurchaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async create(createPurchaseDto: CreatePurchaseDto) {
    try {
      const { purchaseLines, userId, supplierId } = createPurchaseDto;

      let total = 0;
      let productsPrices = [];

      const supplier = await this.prisma.supplier.findUnique({
        where: { id: supplierId, isDeleted: false },
        include: { categories: true },
      });

      if (!supplier) {
        throw new HttpException(
          await this.i18n.translate('messages.supplier.notFound'),
          HttpStatus.BAD_REQUEST,
        );
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId, isDeleted: false },
      });
      if (!user) {
        throw new HttpException(
          await this.i18n.translate('messages.userNotFound'),
          HttpStatus.BAD_REQUEST,
        );
      }

      if (supplier.categories.length === 0) {
        throw new HttpException(
          await this.i18n.translate('messages.supplier.noCategories'),
          HttpStatus.BAD_REQUEST,
        );
      }
      const categoriesSupplier = supplier.categories.map(
        (cat) => cat.categoryId,
      );

      const setCategoriesSupplier = new Set(categoriesSupplier);

      for (const line of purchaseLines) {
        const product = await this.prisma.product.findUnique({
          where: { id: line.productId, isDeleted: false },
          include: { categories: true },
        });
        if (!product) {
          throw new HttpException(
            await this.i18n.translate('messages.product.notFound'),
            HttpStatus.BAD_REQUEST,
          );
        }

        const productCategories = product.categories.map(
          (cat) => cat.categoryId,
        );

        const categoryProductsInSupplier = productCategories.every((cat) =>
          setCategoriesSupplier.has(cat),
        );

        if (!categoryProductsInSupplier) {
          throw new HttpException(
            await this.i18n.translate('messages.purchase.notSupplier', {
              args: { value: product.id },
            }),
            HttpStatus.BAD_REQUEST,
          );
        }

        total += product.price * line.quantity;
        productsPrices.push(product.price);
      }

      const purchase = await this.prisma.purchase.create({
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

      const message = await this.i18n.translate('messages.purchase.created');
      return {
        message,
        purchase,
      };
    } catch (error) {
      return { message: 'Error al crear la compra', error: error.message };
    }
  }

  async findAll(pagination: PaginationArgs) {
    try {
      const { search, startDate, endDate, date } = pagination;
      const dateObj = new Date(date);

      const where: Prisma.PurchaseWhereInput = {
        isDeleted: false,
        ...(search && {
          OR: [
            {
              userId: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              supplierId: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
          ...(startDate &&
            endDate && {
              createdAt: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            }),
          ...(date && {
            createdAt: {
              gte: new Date(dateObj.setUTCHours(0, 0, 0, 0)),
              lte: new Date(dateObj.setUTCHours(23, 59, 59, 999)),
            },
          }),
        }),
      };

      const baseQuery = {
        where,
        ...getPaginationFilter(pagination),
      };

      const total = await this.prisma.purchase.count({ where });
      const data = await this.prisma.purchase.findMany({
        ...baseQuery,
        include: { purchaseLines: { include: { product: true } } },
      });
      const res = paginate(data, total, pagination);
      return res;

    } catch (error) {}
    return this.prisma.purchase.findMany({
      include: { purchaseLines: { include: { product: true } } },
    });
  }

  findOne(id: string) {
    return this.prisma.purchase.findUnique({
      where: { id },
      include: { purchaseLines: { include: { product: true } } },
    });
  }

  remove(id: string) {
    return this.prisma.purchase.delete({ where: { id } });
  }
}
