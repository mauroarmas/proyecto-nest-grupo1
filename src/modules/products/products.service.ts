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
    const { name, price, stock, categoryIds, brandId, gender } = newProduct;

    const existingProduct = await this.prisma.product.findFirst({ where: { name } });

    if (existingProduct) {
      if (price <= 0) {
        throw new ConflictException(this.i18n.translate('messages.invalidNumber'));
      }

      if (stock <= 0) {
        throw new ConflictException(this.i18n.translate('messages.invalidNumber'));
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
      throw new NotFoundException(this.i18n.translate('messages.categoryNoFound'));
    }

    // CREA PRODUCTOS SIN IMAGENES POR EL MOMENTO!!
    return this.prisma.product.create({
      data: {
        name,
        price,
        stock,
        gender: gender,
        brandId,
        categories: { create: categoryIds.map(id => ({ categoryId: id })) },
      },
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      include: { categories: true, brand: true },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { categories: true, brand: true },
    });

    if (!product) {
      throw new NotFoundException(this.i18n.translate('messages.ProductNotFound'));
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(this.i18n.translate('messages.ProductNotFound'));
    }

    const { categoryIds, ...updateData } = updateProductDto;

    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });

  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundException(this.i18n.translate('messages.ProductNotFound'));
    }

    return this.prisma.product.delete({ where: { id } });
  }
}