import { Injectable } from '@nestjs/common';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { translate } from 'src/utils/translation';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async create(createSupplierDto: CreateSupplierDto) {
    try {

      const findEmail= await this.prisma.supplier.findUnique({
        where: { email: createSupplierDto.email },
      });
      if (findEmail) {
        throw new Error(translate(this.i18n, "message.existingMail"));
      }

      const findTaxId = await this.prisma.supplier.findUnique({
        where: { taxId: createSupplierDto.taxId },
      });
      if (findTaxId) {
        throw new Error(translate(this.i18n, "message.existingTaxId"));
      }

      let categories = [];

      for (const category of createSupplierDto.categories) {
        const c = await this.prisma.category.findUnique({
          where: { id: category.categoryId },
        });
  
        if (!c) {
          throw new Error(translate(this.i18n, "message.categoryNotFound"));
        }
        if (categories.some(cat => cat.category.connect.id === category.categoryId)) {
          throw new Error(translate(this.i18n, "message.categoryDuplicated"));
        }
  
        categories.push({
          category: {
            connect: { id: category.categoryId },
          },
        });
      }

      return this.prisma.supplier.create({
        data: {
          ...createSupplierDto,
          categories: {
            create: categories,
          },
        }
      });
    } catch (error) {
      return { error: error.message };
    }
  }

  findAll() {
    try {
      return this.prisma.supplier.findMany({
        include: {
          categories: true,
        },
      });
    } catch (error) {
      return { error: error.message };
    }
  }

  findOne(id: string) {
    return this.prisma.supplier.findUnique({ where: { id } });
  }

  update(id: string, updateSupplierDto: UpdateSupplierDto) {
    try {
      const categories = updateSupplierDto.categories.map((category) => ({
        category: {
          connect: { id: category.categoryId },
        },
      }));
      return this.prisma.supplier.update({
        where: { id },
        data: {
          ...updateSupplierDto,
          categories: {
            create: categories,
          },
        },
      });
    } catch (error) {
      return { error: error.message };
    }
  }

  remove(id: string) {
    return this.prisma.supplier.delete({ where: { id } });
  }
}
