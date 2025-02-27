import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Gender, Prisma } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { PaginationArgs } from 'src/utils/pagination/pagination.dto';
import { getPaginationFilter } from 'src/utils/pagination/pagination.utils';
import { paginate } from 'src/utils/pagination/parsing';
import { ExcelService } from '../excel/excel.service';
import { ExcelColumn } from 'src/common/interfaces';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly excelService: ExcelService
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
      { header: 'Categorías', key: 'categories' },
    ];

    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      brand: product.brand?.name || 'N/A',
      categories: product.categories
        ?.map((categoryProduct) => categoryProduct.category.name)
        .join(', ') || 'Sin categoría',
    }));

    const workbook = await this.excelService.generateExcel(formattedProducts, columns, 'Productos');
    await this.excelService.exportToResponse(res, workbook, 'products.xlsx');
  }

  // async uploadExcel(file: Express.Multer.File) {
  //   const buffer = file.buffer;
  //   const products = await this.excelService.readExcel(buffer);
  
  //   const processedProducts = [];
  
  //   // Obtener las marcas válidas y sus IDs
  //   const validBrands = await this.prisma.brand.findMany({
  //     select: { name: true, id: true },
  //   });
  //   const validBrandNames = validBrands.map((brand) => brand.name);
  //   const validBrandIds = new Map(validBrands.map((brand) => [brand.name, brand.id]));
  
  //   // Obtener las categorías válidas
  //   const allCategories = await this.prisma.category.findMany({
  //     select: { name: true, id: true },
  //   });
  //   const allCategoryNames = allCategories.map((category) => category.name);
  
  //   for (const product of products) {
  //     const { Name, Price, Stock, Brand, Categories } = product;
  
  //     // Validación de marca
  //     if (!validBrandNames.includes(Brand)) {
  //       throw new Error(`Marca "${Brand}" no válida.`);
  //     }
  
  //     // Validación de categorías y creación de las conexiones
  //     const categoryConnections = [];
  //     for (const categoryName of Categories) {
  //       if (!allCategoryNames.includes(categoryName)) {
  //         throw new Error(`Categoría no encontrada: ${categoryName}`);
  //       }
  //       const category = await this.prisma.category.findFirst({
  //         where: { name: categoryName },
  //       });
  //       if (category) {
  //         categoryConnections.push(category);
  //       }
  //     }
  
  //     // Buscar si el producto ya existe
  //     let existingProduct = await this.prisma.product.findFirst({
  //       where: { name: Name },
  //     });
  
  //     // Si el producto existe, actualizamos el stock
  //     if (existingProduct) {
  //       existingProduct = await this.prisma.product.update({
  //         where: { id: existingProduct.id },
  //         data: {
  //           stock: existingProduct.stock + Stock,
  //         },
  //       });
  //       processedProducts.push(existingProduct);
  //     } else {
  //       // Si el producto no existe, lo creamos
  //       const brandId = validBrandIds.get(Brand);
  
  //       const newProduct = await this.prisma.product.create({
  //         data: {
  //           name: Name,
  //           price: Price,
  //           stock: Stock,
  //           brandId: brandId,
  //           gender: Gender.UNISEX, // Asumimos un valor predeterminado de género
  //           categories: {
  //             connect: categoryConnections.map((category) => ({ id: category.id })),
  //           },
  //         },
  //       });
  
  //       processedProducts.push(newProduct);
  //     }
  //   }
  
  //   return processedProducts;
  // }  
}