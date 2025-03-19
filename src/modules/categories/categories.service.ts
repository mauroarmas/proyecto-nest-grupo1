import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
      throw new BadRequestException(this.i18n.translate('messages.categoryDuplicated'));
    }

    const invalidCharacters = /[^\p{L}\p{N}\s]/u;  // \p{L} = cualquier letra, \p{N} = cualquier número
    if (invalidCharacters.test(name)) {
      throw new BadRequestException(this.i18n.translate('messages.categoryInvalidName'));
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
        throw new NotFoundException(this.i18n.translate('messages.ProductNotFound'));
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
      throw new NotFoundException(this.i18n.translate('messages.categoryNoFound'));
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const { productIds, name } = updateCategoryDto;

    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(this.i18n.translate('messages.categoryNoFound'));
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
        throw new NotFoundException(this.i18n.translate('messages.ProductNotFound'));
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
      throw new NotFoundException(this.i18n.translate('messages.categoryNoFound'));
    }

    await this.prisma.categoryProduct.deleteMany({
      where: { categoryId: id },
    });

    return this.prisma.category.delete({
      where: { id },
    });
  }
}