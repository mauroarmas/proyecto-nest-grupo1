import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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
    const { name, price, stock, categoryIds, images, brandId, gender } = newProduct;

    const existingProduct = await this.prisma.product.findFirst({ where: { name } });

    // Si el producto ya existe, aumentamos el stock
    if (existingProduct) {
      if (stock <= 0) {
        throw new ConflictException(await this.i18n.translate('product.invalidStock'));
      }
      return this.prisma.product.update({
        where: { id: existingProduct.id },
        data: {
          stock: existingProduct.stock + stock,
        },
      });
    }

    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });

    if (categories.length !== categoryIds.length) {
      throw new NotFoundException(await this.i18n.translate('product.categoryNotFound'));
    }

    return this.prisma.product.create({
      data: {
        name,
        price,
        stock,
        gender: 'UNISEX', //Prueba
        brandId: '1', //prueba
        categories: { create: categoryIds.map(id => ({ categoryId: id })) },
        images: { create: images.map(url => ({ url })) },
      },
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      include: { categories: true, images: true, brand: true },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { categories: true, images: true, brand: true },
    });

    if (!product) {
      throw new NotFoundException(await this.i18n.translate('product.notFound'));
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(await this.i18n.translate('product.notFound'));
    }

    const { categoryIds, images, ...updateData } = updateProductDto;

    return this.prisma.product.update({
      where: { id },
      data: {
        ...updateData,
        categories: categoryIds
          ? {
            deleteMany: {},
            create: categoryIds.map(categoryId => ({ categoryId })),
          }
          : undefined,
        images: images
          ? {
            deleteMany: {},
            create: images.map(url => ({ url })),
          }
          : undefined,
      },
      include: {
        categories: true,
        images: true,
      },
    });
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundException(await this.i18n.translate('product.notFound'));
    }

    return this.prisma.product.delete({ where: { id } });
  }
}