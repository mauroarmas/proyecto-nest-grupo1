import { ProductImage } from './../../../node_modules/.prisma/client/index.d';
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { PaginationArgs } from 'src/utils/pagination/pagination.dto';
import { getPaginationFilter } from 'src/utils/pagination/pagination.utils';
import { paginate } from 'src/utils/pagination/parsing';

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
      include: { images: true },
    });
  }

  async findAll(pagination: PaginationArgs) {
    try {
      const { search, startDate, endDate, date } = pagination;

      const dateObj = new Date(date);

      const where: Prisma.ProductWhereInput = {
        isDeleted: false,
        ...(search && {
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              price: {
                equals: !isNaN(parseFloat(search)) ? parseFloat(search) : undefined,
              }
            },
            {
              brand: {
                name: {
                  contains: search,
                  mode: 'insensitive'
                },
              },
            }
          ],
        }),
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
      };

      const baseQuery = {
        where,
        ...getPaginationFilter(pagination),
        include: {
          images: true,
          categories: true,
        },
      };

      const total = await this.prisma.product.count({ where });
      const products = await this.prisma.product.findMany(baseQuery);
      const res = paginate(products, total, pagination);
      return res;
    } catch (error) {
      return { error: error.message };
    }
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { categories: true, brand: true, images: true },
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
    const deleteProduct = this.prisma.product.update({
      where: { id },
      data: { isDeleted: true },
    });
    return {
      message: this.i18n.translate('messages.ProductDeleted'),
      deletedProduct: deleteProduct,
    }
  }
}