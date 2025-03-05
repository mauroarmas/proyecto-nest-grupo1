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
import { ExcelService } from '../excel/excel.service';
import { ExcelColumn } from 'src/common/interfaces';

@Injectable()
export class SuppliersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly excelService: ExcelService,
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
        createSupplierDto.categories || [],
      );

      const supplier = await this.prisma.supplier.create({
        data: {
          ...createSupplierDto,
          categories: {
            create: categories.map((category) => ({
              category: { connect: { id: category.id } },
            })),
          },
        },
      });

      return {
        message: translate(this.i18n, 'messages.supplier.created'),
        supplier,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        await this.i18n.translate('messages.serverError', {
          args: { error: error.message },
        }),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        await this.i18n.translate('messages.serverError', {
          args: { error: error.message },
        }),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        await this.i18n.translate('messages.serverError', {
          args: { error: error.message },
        }),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: string, updateSupplierDto: UpdateSupplierDto) {
    try {
      const findSupplier = await this.prisma.supplier.findUnique({
        where: { id, isDeleted: false },
      });

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
        const categories = await this.validateAndFormatCategories(
          updateSupplierDto.categories,
        );

        await this.prisma.categorySupplier.deleteMany({
          where: {
            supplierId: id,
          },
        });

        await this.prisma.categorySupplier.createMany({
          data: categories.map((category) => ({
            supplierId: id, // Agregar supplierId manualmente
            categoryId: category.id, // Corregir cómo se pasan los IDs
          })),
        });
      }

      const { categories, ...supplierData } = updateSupplierDto;

      const supplier = await this.prisma.supplier.update({
        where: { id },
        data: supplierData,
        include: { categories: true },
      });

      return {
        message: translate(this.i18n, 'messages.supplier.updated'),
        supplier,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        await this.i18n.translate('messages.serverError', {
          args: { error: error.message },
        }),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string) {
    try {
      const findSupplier = await this.prisma.supplier.findUnique({
        where: { id, isDeleted: false },
      });

      if (!findSupplier) {
        throw new HttpException(
          await this.i18n.translate('messages.supplier.notFound'),
          HttpStatus.NOT_FOUND,
        );
      }

      await this.prisma.supplier.update({
        where: { id },
        data: { isDeleted: true },
      });

      return { message: translate(this.i18n, 'messages.supplier.deleted') };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        await this.i18n.translate('messages.serverError', {
          args: { error: error.message },
        }),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAllExcel(res: Response) {
    try {
      const suppliers = await this.prisma.supplier.findMany({
        where: { isDeleted: false },
        include: { categories: true },
      });

      const categoriesNames = [];
      for (const supplier of suppliers) {
        const categories = await this.prisma.category.findMany({
          where: {
            id: { in: supplier.categories.map((cat) => cat.categoryId) },
          },
          select: { name: true },
        });

        categoriesNames.push(categories.map((cat) => cat.name).join(','));
      }

      const data = suppliers.map((supplier, index) => ({
        id: supplier.id,
        name: supplier.name,
        email: supplier.email,
        taxId: supplier.taxId,
        phone: supplier.phone,
        categories: categoriesNames[index],
      }));

      const columns: ExcelColumn[] = [
        { header: 'Id', key: 'id' },
        { header: 'CUIT', key: 'taxId' },
        { header: 'Nombre', key: 'name' },
        { header: 'Email', key: 'email' },
        { header: 'Telefono', key: 'phone' },
        { header: 'Categorias', key: 'categories' },
      ];

      const workbook = await this.excelService.generateExcel(
        data,
        columns,
        'Proveedores',
      );
      await this.excelService.exportToResponse(res, workbook, 'suppliers.xlsx');
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        await this.i18n.translate('messages.serverError', {
          args: { error: error.message },
        }),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async validateAndFormatCategories(categoryIds: string[]) {
    try {
      if (!categoryIds || categoryIds.length === 0) {
        return [];
      }

      const existingCategories = await this.prisma.category.findMany({
        where: { id: { in: categoryIds }, isDeleted: false },
        select: { id: true },
      });

      const existingCategoryIds = new Set(
        existingCategories.map((cat) => cat.id),
      );

      for (const categoryId of categoryIds) {
        if (!existingCategoryIds.has(categoryId)) {
          throw new HttpException(
            await this.i18n.translate('messages.categoryNoFound'),
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      if (new Set(categoryIds).size !== categoryIds.length) {
        throw new HttpException(
          await this.i18n.translate('messages.categoryDuplicated'),
          HttpStatus.BAD_REQUEST,
        );
      }

      return categoryIds.map((categoryId) => ({ id: categoryId }));
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        await this.i18n.translate('messages.serverError', {
          args: { error: error.message },
        }),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async uploadExcel(file: Express.Multer.File) {
    try {
      const rows = await this.excelService.readExcel(file.buffer);

      for (const row of rows) {
        const { name, email, phone, categories } = row;
        if (!name || !email || !phone || !categories || !row.taxid) {
          throw new HttpException(
            await this.i18n.translate('messages.incompletedFields'),
            HttpStatus.NOT_FOUND,
          );
        }
      
        const taxId = row.taxid.toString();

        let existingSupplier = await this.prisma.supplier.findFirst({
          where: {
            OR: [{ taxId }, { email }],
          },
        });

        const categoriesArray = categories ? categories.split(',') || [] : []; // converitir a array
        if (categoriesArray.length === 0) {
          throw new HttpException(
            await this.i18n.translate('messages.categoriesEmpty', {
              args: { name },
            }),
            HttpStatus.NOT_FOUND,
          );
        }
        const categoryIds = await Promise.all(
          categoriesArray.map(async (category) => {
            const categoryRecord = await this.prisma.category.findFirst({
              where: { name: category },
            });
            return categoryRecord?.id;
          }),
        );
        for (let i = 0; i < categoryIds.length; i++) {
          const category = categoryIds[i];

          if (!category) {
            throw new HttpException(
              await this.i18n.translate('messages.categoryInexistentWithName', {
                args: { name: categoriesArray[i] },
              }),
              HttpStatus.NOT_FOUND,
            );
          }
        }

        const categoriesObject =
          await this.validateAndFormatCategories(categoryIds); //convertir objeto

        if (existingSupplier) {
          await this.prisma.categorySupplier.deleteMany({
            where: {
              supplierId: existingSupplier.id,
            },
          });
          await this.prisma.categorySupplier.createMany({
            data: categoriesObject.map((category) => ({
              supplierId: existingSupplier.id, // Agregar supplierId manualmente
              categoryId: category.id, // Corregir cómo se pasan los IDs
            })),
          });

          const supplier = await this.prisma.supplier.update({
            where: { id: existingSupplier.id },
            data: existingSupplier,
            include: { categories: true },
          });
        } else {
          const { categories, taxid, ...supplierData } = row;

          const supplier = await this.prisma.supplier.create({
            data: {
              ...supplierData,
              taxId,
              categories: {
                create: categoriesObject.map((category) => ({
                  category: { connect: { id: category.id } },
                })),
              },
            },
          });
        }
      }

      return { message: 'Suppliers loaded successfully' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        await this.i18n.translate('messages.serverError', {
          args: { error: error.message },
        }),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
