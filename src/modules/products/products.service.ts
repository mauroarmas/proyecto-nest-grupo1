import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) { }

  async create(newProduct: CreateProductDto) {
    const { name, price, stock, categoryIds, images } = newProduct;

    const existingProduct = await this.prisma.product.findFirst({
      where: { name },
    });

    if (existingProduct) {
      // Si el producto existe, se actualiza el stock
      return this.prisma.product.update({
        where: { id: existingProduct.id },
        data: { stock: { increment: stock } },
      });
    }

    const categories = await this.prisma.category.findMany({
      where: {
        id: {
          in: categoryIds,
        },
      },
    });

    if (categories.length !== categoryIds.length) {
      throw new NotFoundException(
        await this.i18n.translate('product.categoryNotFound'),
      );
    }

    // return this.prisma.product.create({
    //   data: {
    //     name,
    //     price,
    //     stock,
    //     images: {
    //       create: images ? images.map((image) => ({ url: image.url })) : [],
    //     },
    //     categories: {
    //       create: categoryIds.map((categoryId) => ({ categoryId })),
    //     },
    //   },
    // });
  }

  async findAll() {
    return this.prisma.product.findMany({
      include: { categories: true, images: true },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { categories: true, images: true },
    });

    if (!product) {
      throw new NotFoundException(
        await this.i18n.translate('product.notFound'),
      );
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(
        await this.i18n.translate('product.notFound'),
      );
    }

    // return this.prisma.product.update({
    //   where: { id },
    //   data: updateProductDto,
    // });
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(
        await this.i18n.translate('product.notFound'),
      );
    }

    // Elimina el producto. Gracias a la cascada, las imágenes se eliminarán automáticamente.
    return this.prisma.product.delete({ where: { id } });
  }
}
