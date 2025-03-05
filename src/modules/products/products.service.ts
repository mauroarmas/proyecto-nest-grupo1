import { ProductImage } from './../../../node_modules/.prisma/client/index.d';
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { PaginationArgs } from 'src/utils/pagination/pagination.dto';
import { getPaginationFilter } from 'src/utils/pagination/pagination.utils';
import { paginate } from 'src/utils/pagination/parsing';
import { ExcelService } from '../excel/excel.service';
import { ExcelColumn } from 'src/common/interfaces';
import { Gender } from '@prisma/client';
import { SuppliersService } from '../suppliers/suppliers.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly excelService: ExcelService,
    private readonly suppliersService: SuppliersService,
  ) {}

  async create(newProduct: CreateProductDto) {
    const { name, price, stock, categoryIds, brandId, gender } = newProduct;

    const existingProduct = await this.prisma.product.findFirst({
      where: { name },
    });

    if (existingProduct) {
      if (price <= 0) {
        throw new ConflictException(
          this.i18n.translate('messages.invalidNumber'),
        );
      }

      if (stock <= 0) {
        throw new ConflictException(
          this.i18n.translate('messages.invalidNumber'),
        );
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
      throw new NotFoundException(
        this.i18n.translate('messages.categoryNoFound'),
      );
    }

    // CREA PRODUCTOS SIN IMAGENES POR EL MOMENTO!!
    return this.prisma.product.create({
      data: {
        name,
        price,
        stock,
        gender: gender,
        brandId,
        categories: { create: categoryIds.map((id) => ({ categoryId: id })) },
      },
      include: { images: true },
    });
  }

  async findAll(pagination: PaginationArgs) {
    try {
      console.log(Gender);
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
                equals: !isNaN(parseFloat(search))
                  ? parseFloat(search)
                  : undefined,
              },
            },
            {
              brand: {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            },
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
      throw new NotFoundException(
        this.i18n.translate('messages.ProductNotFound'),
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
        this.i18n.translate('messages.ProductNotFound'),
      );
    }

    const { categoryIds, ...updateData } = updateProductDto;

    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundException(
        this.i18n.translate('messages.ProductNotFound'),
      );
    }
    const deleteProduct = this.prisma.product.update({
      where: { id },
      data: { isDeleted: true },
    });
    return {
      message: this.i18n.translate('messages.ProductDeleted'),
      deletedProduct: deleteProduct,
    };
  }

  async exportAllExcel(res: Response) {
    const products = await this.prisma.product.findMany({
      where: { isDeleted: false },
      include: {
        brand: true,
        categories: { include: { category: true } },
      },
    });

    const columns: ExcelColumn[] = [
      { header: 'ID del Producto', key: 'id' },
      { header: 'Nombre', key: 'name' },
      { header: 'Precio', key: 'price' },
      { header: 'Stock', key: 'stock' },
      { header: 'Marca', key: 'brand' },
      { header: 'Genero', key: 'gender' },
      { header: 'Categorias', key: 'categories' },
    ];

    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      brand: product.brand?.name || 'N/A',
      gender: product.gender,
      categories:
        product.categories
          ?.map((categoryProduct) => categoryProduct.category.name)
          .join(',') || 'Sin categoría',
    }));

    const workbook = await this.excelService.generateExcel(
      formattedProducts,
      columns,
      'Productos',
    );
    await this.excelService.exportToResponse(res, workbook, 'products.xlsx');
  }

  async uploadExcel(file: Express.Multer.File) {
    const products = await this.excelService.readExcel(file.buffer);

    for (const element of products) {
      const { nombre, precio, stock, marca, categorias, genero } = element;
      if (!nombre || !precio || !stock || !categorias || !marca || !genero) {
        throw new ConflictException(
          await this.i18n.translate('messages.incompletedFields'),
        );
      }
      const priceFloat = parseFloat(precio);

      const existingProduct = await this.prisma.product.findFirst({
        where: { name: nombre },
      });

      if (
        !Object.prototype.hasOwnProperty.call(
          Gender,
          genero.toString().toUpperCase(),
        )
      ) {
        throw new ConflictException(
          this.i18n.translate('messages.genderInexistent'),
        );
      }

      if (precio <= 0 || stock <= 0) {
        throw new ConflictException(
          this.i18n.translate('messages.invalidNumber'),
        );
      }

      let brandData = await this.prisma.brand.findFirst({
        where: { name: marca },
      });
      if (!brandData) {
        brandData = await this.prisma.brand.create({
          data: { name: marca },
        });
      }

      const categoriesArray = categorias ? categorias.split(',') || [] : [];
      if (categoriesArray.length === 0) {
        throw new NotFoundException(
          await this.i18n.translate('messages.categoriesEmpty', {
            args: { nombre },
          }),
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
          throw new NotFoundException(
            await this.i18n.translate('messages.categoryInexistentWithName', {
              args: { name: categoriesArray[i] },
            }),
          );
        }
      }

      const categoriesObject =
        await this.suppliersService.validateAndFormatCategories(categoryIds);

      if (existingProduct) {
        await this.prisma.categoryProduct.deleteMany({
          where: {
            productId: existingProduct.id,
          },
        });
        await this.prisma.categoryProduct.createMany({
          data: categoriesObject.map((category) => ({
            productId: existingProduct.id,
            categoryId: category.id,
          })),
        });
        const product = await this.prisma.product.update({
          where: { id: existingProduct.id },
          data: {
            name: nombre,
            price: priceFloat,
            stock,
            gender: genero,
          },

          include: { categories: true, brand: true },
        });
      } else {
        const product = await this.prisma.product.create({
          data: {
            name:nombre,
            gender: genero,
            stock,
            price: priceFloat,
            brand: { connect: { id: brandData.id } },
            categories: {
              create: categoriesObject.map((category) => ({
                category: { connect: { id: category.id } },
              })),
            },
          },
        });
      }
    }
  }
}
