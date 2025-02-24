import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) { }

  async create(createCategoryDto: CreateCategoryDto) {
    const { productIds, name } = createCategoryDto;

    const existingCategories = await this.prisma.category.findMany();
    const categoryExists = existingCategories.some(category =>
      category.name.toLowerCase() === name.toLowerCase()
    );

    if (categoryExists) {
      const errorMessage = await this.i18n.translate('category.alreadyExists');
      throw new NotFoundException(errorMessage);
    }

    if (productIds.length > 0) {
      const products = await this.prisma.product.findMany({
        where: {
          id: {
            in: productIds,
          },
        },
      });

      if (productIds.length !== products.length) {
        throw new NotFoundException(
          await this.i18n.translate('category.productNotFound'),
        );
      }
    }

    const category = await this.prisma.category.create({
      data: {
        name,
        products: {
          create: productIds.map((productId) => ({
            productId,
          })),
        },
      },
    });

    return category;
  }

  async findAll() {
    return this.prisma.category.findMany({
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(
        await this.i18n.translate('category.notFound'),
      );
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const { productIds, name } = updateCategoryDto;

    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(
        await this.i18n.translate('category.notFound'),
      );
    }

    if (productIds && productIds.length > 0) {
      const products = await this.prisma.product.findMany({
        where: {
          id: {
            in: productIds,
          },
        },
      });

      if (products.length !== productIds.length) {
        throw new NotFoundException(
          await this.i18n.translate('category.productNotFound'),
        );
      }

      await this.prisma.categoryProduct.deleteMany({
        where: { categoryId: id },
      });

      await this.prisma.categoryProduct.createMany({
        data: productIds.map((productId) => ({
          categoryId: id, 
          productId,
        })),
      });
    }

    if (name) {
      await this.prisma.category.update({
        where: { id },
        data: { name },
      });
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(
        await this.i18n.translate('category.notFound'),
      );
    }

    await this.prisma.categoryProduct.deleteMany({
      where: { categoryId: id },
    });

    return this.prisma.category.delete({
      where: { id },
    });
  }
}