import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { translate } from 'src/utils/translation';
import { PaginationArgs } from 'src/utils/pagination/pagination.dto';
import { Prisma } from '@prisma/client';
import { getPaginationFilter } from 'src/utils/pagination/pagination.utils';
import { paginate } from 'src/utils/pagination/parsing';

@Injectable()
export class SuppliersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async create(createSupplierDto: CreateSupplierDto) {
    try {
      const findEmail = await this.prisma.supplier.findUnique({
        where: { email: createSupplierDto.email, isDeleted: false },
      });

      if (findEmail) {
        throw new HttpException(
          await this.i18n.translate('messages.supplier.existingMail'),
          HttpStatus.BAD_REQUEST,
        );
      }

      const findTaxId = await this.prisma.supplier.findUnique({
        where: { taxId: createSupplierDto.taxId, isDeleted: false },
      });
      if (findTaxId) {
        throw new HttpException(
          await this.i18n.translate('messages.supplier.existingTaxId'),
          HttpStatus.BAD_REQUEST,
        );
      }

      const categories = await this.validateAndFormatCategories(
        createSupplierDto.categories?.map(cat => cat.categoryId) || []
      );

      const supplier = await this.prisma.supplier.create({
        data: {
          ...createSupplierDto,
          categories: {
            create: categories,
          },
        },
        include: { categories: true },
      });

      return {
        message: translate(this.i18n, 'messages.supplier.created'),
        supplier,
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async findAll(pagination: PaginationArgs) {
    try {
      const { search, startDate, endDate, date } = pagination;
      const dateObj = new Date(date);

      const where: Prisma.SupplierWhereInput = {
        isDeleted: false,
        ...(search && {
          OR: [
            {
              email: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              taxId: {
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
        include: { categories: true },
        ...getPaginationFilter(pagination),
      };

      const total = await this.prisma.supplier.count({ where });
      const suppliers = await this.prisma.supplier.findMany(baseQuery);
      const res = paginate(suppliers, total, pagination);

      return res;
    } catch (error) {
      return { error: error.message };
    }
  }

  async findOne(id: string) {
    try {
      const supplier = await this.prisma.supplier.findUnique({
        where: { id, isDeleted: false },
        include: { categories: true },
      });

      return supplier
        ? supplier
        : { error: translate(this.i18n, 'messages.supplier.notFound') };
    } catch (error) {
      return { error: error.message };
    }
  }

  async update(id: string, updateSupplierDto: UpdateSupplierDto) {
    try {
      const findSupplier = await this.prisma.supplier.findUnique({ where: { id, isDeleted: false } });
  
      if (!findSupplier) {
        throw new HttpException(
          await this.i18n.translate('messages.supplier.notFound'),
          HttpStatus.NOT_FOUND,
        );
      }
  
      if (updateSupplierDto.email) {
        const existingSupplier = await this.prisma.supplier.findUnique({
          where: { email: updateSupplierDto.email },
        });
  
        if (existingSupplier && existingSupplier.id !== id) {
          throw new HttpException(
            await this.i18n.translate('messages.supplier.existingMail'),
            HttpStatus.BAD_REQUEST,
          );
        }
      }
  
      if (updateSupplierDto.taxId) {
        const existingSupplier = await this.prisma.supplier.findUnique({
          where: { taxId: updateSupplierDto.taxId },
        });
  
        if (existingSupplier && existingSupplier.id !== id) {
          throw new HttpException(
            await this.i18n.translate('messages.supplier.existingTaxId'),
            HttpStatus.BAD_REQUEST,
          );
        }
      }
  
      if (updateSupplierDto.categories) {
        const categoryIds = updateSupplierDto.categories.map(cat => cat.categoryId);
        const categories = await this.validateAndFormatCategories(categoryIds);
  
        await this.prisma.$transaction([
          this.prisma.categorySupplier.deleteMany({ where: { supplierId: id } }),
          this.prisma.categorySupplier.createMany({ data: categories.map(cat => ({ ...cat, supplierId: id })) }),
        ]);
      }
  
  
      const { categories, ...supplierData } = updateSupplierDto;
  
      const supplier = await this.prisma.supplier.update({
        where: { id },
        data: supplierData,
        include: { categories: true }
      });

      return {
        message: translate(this.i18n, 'messages.supplier.updated'),
        supplier,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
  
  remove(id: string) {
    return this.prisma.supplier.delete({ where: { id } });
  }

  private async validateAndFormatCategories(categoryIds: string[]) {
    if (!categoryIds || categoryIds.length === 0) {
      return [];
    }
  
    // Obtener las categorías existentes en la BD
    const existingCategories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds }, isDeleted: false },
      select: { id: true },
    });
  
    // Convertir en un Set para validaciones rápidas
    const existingCategoryIds = new Set(existingCategories.map(cat => cat.id));
  
    // Validar si todas las categorías existen
    for (const categoryId of categoryIds) {
      if (!existingCategoryIds.has(categoryId)) {
        throw new HttpException(
          await this.i18n.translate('messages.category.notFound'),
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  
    // Evitar duplicados en la misma solicitud
    if (new Set(categoryIds).size !== categoryIds.length) {
      throw new HttpException(
        await this.i18n.translate('messages.category.duplicated'),
        HttpStatus.BAD_REQUEST,
      );
    }
  
    // Formatear los datos para Prisma
    return categoryIds.map(categoryId => ({ categoryId }));
  }
  
}
