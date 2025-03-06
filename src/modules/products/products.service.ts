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
import { Response } from 'express';
import { ChartConfiguration } from 'chart.js';
import { ChartService } from '../chart/chart.service';
import { PrinterService } from '../printer/printer.service';
import { generatePDFBestSeller } from '../printer/documents/sellsAndBSProducts';


@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly excelService: ExcelService,
    private readonly suppliersService: SuppliersService,
    private readonly chartService: ChartService,
    private readonly printerService: PrinterService,
  ) { }

  async create(newProduct: CreateProductDto) {
    const { name, price, stock, categoryIds, brandId, gender } = newProduct;

    const existingProduct = await this.prisma.product.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
      },
    });

    if (existingProduct) {
      throw new ConflictException(
        this.i18n.translate('messages.productAlreadyExists'),
      );
    }

    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });

    if (categories.length !== categoryIds.length) {
      throw new NotFoundException(
        this.i18n.translate('messages.categoryNoFound'),
      );
    }

    return this.prisma.product.create({
      data: {
        name,
        price,
        stock,
        gender,
        brandId,
        categories: { create: categoryIds.map((id) => ({ categoryId: id })) },
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

    const filteredUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined && value !== null)
    );

    return this.prisma.product.update({
      where: { id },
      data: filteredUpdateData,
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
            name: nombre,
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


  async getBestSellerProductsChart(quantity: number): Promise<Buffer> {
    const bestSeller = await this.getMostPurchasedProducts(quantity);

    const labels = bestSeller.map((bs) => bs.productName + ' - $' + bs.totalRevenue);
    const data = bestSeller.map((bs) => bs.sells);

    const chartData = {
      labels,
      datasets: [
        {
          label: 'Cantidad de Ventas',
          data,
          backgroundColor: 'rgb(255, 205, 86)',
        },
      ],
    };

    const chartOptions: ChartConfiguration['options'] = {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: {
          display: true,
          text: 'Productos Más Vendidos',
        },
      },
    };

    const chartBuffer = await this.chartService.generateChart(
      'bar',
      chartData,
      chartOptions,
    );

    const pdfDefinition = await generatePDFBestSeller(chartBuffer);

    const pdfDoc = await this.printerService.createPdf(pdfDefinition);

    return new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = [];
      pdfDoc.on('data', (chunk) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });
  }

  async getMostPurchasedProducts(quantity: number) {
    const productsSum = await this.prisma.cartLine.groupBy({
      by: ['productId'],
      where: {
        cart: {
          status: 'completed',
        }
      },
      _sum: {
        quantity: true,
        subtotal: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      }
    });

    const limitedProductsSum = productsSum.slice(0, quantity);
    let bestSeller = []

    for (const p of limitedProductsSum) {
      const product = await this.prisma.product.findUnique({
        where: { id: p.productId }
      })

      bestSeller.push({ productName: product.name, sells: p._sum.quantity, totalRevenue: p._sum.subtotal })
    }

    return bestSeller;
  }
}
