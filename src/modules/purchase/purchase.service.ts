import { Injectable } from '@nestjs/common';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { PrismaService } from '../prisma/prisma.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { PaginationArgs } from 'src/utils/pagination/pagination.dto';
import { Prisma } from '@prisma/client';
import { getPaginationFilter } from 'src/utils/pagination/pagination.utils';
import { paginate } from 'src/utils/pagination/parsing';
import { ExcelService } from '../excel/excel.service';
import { ExcelColumn } from 'src/common/interfaces';
import { Response } from 'express';
import { ChartService } from '../chart/chart.service';
import { ChartConfiguration } from 'chart.js';
import { PrinterService } from '../printer/printer.service';
import { generatePDF } from '../printer/documents/sample.report';

@Injectable()
export class PurchaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly excelService: ExcelService,
    private readonly chartService: ChartService,
    private readonly printerService: PrinterService,
  ) { }

  async create(createPurchaseDto: CreatePurchaseDto, userId: string) {
    try {
      const { purchaseLines, supplierId } = createPurchaseDto;
      console.log(userId)
      let total = 0;
      let productsPrices = [];

      const supplier = await this.prisma.supplier.findUnique({
        where: { id: supplierId, isDeleted: false },
        include: { categories: true },
      });

      if (!supplier) {
        throw new HttpException(
          await this.i18n.translate('messages.supplier.notFound'),
          HttpStatus.BAD_REQUEST,
        );
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId, isDeleted: false },
      });
      if (!user) {
        throw new HttpException(
          await this.i18n.translate('messages.userNotFound'),
          HttpStatus.BAD_REQUEST,
        );
      }

      if (supplier.categories.length === 0) {
        throw new HttpException(
          await this.i18n.translate('messages.supplier.noCategories'),
          HttpStatus.BAD_REQUEST,
        );
      }
      const categoriesSupplier = supplier.categories.map(
        (cat) => cat.categoryId,
      );

      const setCategoriesSupplier = new Set(categoriesSupplier);

      for (const line of purchaseLines) {
        const product = await this.prisma.product.findUnique({
          where: { id: line.productId, isDeleted: false },
          include: { categories: true },
        });
        if (!product) {
          throw new HttpException(
            await this.i18n.translate('messages.product.notFound'),
            HttpStatus.BAD_REQUEST,
          );
        }

        const productCategories = product.categories.map(
          (cat) => cat.categoryId,
        );

        const categoryProductsInSupplier = productCategories.every((cat) =>
          setCategoriesSupplier.has(cat),
        );

        if (!categoryProductsInSupplier) {
          throw new HttpException(
            await this.i18n.translate('messages.purchase.notSupplier', {
              args: { value: product.id },
            }),
            HttpStatus.BAD_REQUEST,
          );
        }

        total += product.price * line.quantity;
        productsPrices.push(product.price);
      }

      const purchase = await this.prisma.purchase.create({
        data: {
          userId,
          total,
          supplierId,
          purchaseLines: {
            create: purchaseLines.map((line, index) => ({
              productId: line.productId,
              quantity: line.quantity,
              subtotal: productsPrices[index] * line.quantity,
            })),
          },
        },
        include: {
          purchaseLines: {
            include: { product: true },
          },
        },
      });

      for (const line of purchaseLines) {
        await this.prisma.product.update({
          where: { id: line.productId },
          data: { stock: { increment: line.quantity } },
        });
      }

      const message = await this.i18n.translate('messages.purchase.created');
      return {
        message,
        purchase,
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

      const where: Prisma.PurchaseWhereInput = {
        isDeleted: false,
        ...(search && {
          OR: [
            {
              userId: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              supplierId: {
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
        ...getPaginationFilter(pagination),
      };

      const total = await this.prisma.purchase.count({ where });
      const data = await this.prisma.purchase.findMany({
        ...baseQuery,
        include: { purchaseLines: { include: { product: true } } },
      });
      const res = paginate(data, total, pagination);
      return res;
    } catch (error) { }
    return this.prisma.purchase.findMany({
      include: { purchaseLines: { include: { product: true } } },
    });
  }

  findOne(id: string) {
    return this.prisma.purchase.findUnique({
      where: { id },
      include: { purchaseLines: { include: { product: true } } },
    });
  }

  remove(id: string) {
    return this.prisma.purchase.delete({ where: { id } });
  }

  async findAllExcel(res: Response) {
    try {
      const purchases = await this.prisma.purchase.findMany({
        where: { isDeleted: false },
        include: { purchaseLines: { include: { product: true } } }
      });


      const columns: ExcelColumn[] = [
        { header: 'Compra', key: 'id' },
        { header: 'Usuario', key: 'userId' },
        { header: 'Proveedor', key: 'supplierId' },
        { header: 'Total', key: 'total' },
        { header: 'Fecha', key: 'createdAt' },
        { header: 'Productos (Cantidad)', key: 'products' },
      ];

      const formattedPurchases = purchases.map((purchase) => ({
        id: purchase.id,
        userId: purchase.userId,
        supplierId: purchase.supplierId,
        total: purchase.total,
        createdAt: purchase.createdAt,
        products: purchase.purchaseLines.map((line) => (
          `${line.product.name} (${line.quantity})`
        )),
      }));

      const workbook = await this.excelService.generateExcel(
        formattedPurchases,
        columns,
        'Compras',
      );
      await this.excelService.exportToResponse(res, workbook, 'purchases.xlsx');
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

  //GRAFICAS
  async generatePurchaseBarChart(): Promise<Buffer> {
    const purchases = await this.prisma.purchase.findMany({
      select: { id: true, total: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const groupedByDate = {};

    purchases.forEach((purchase) => {
      const date = purchase.createdAt.toISOString().split('T')[0];
      if (!groupedByDate[date]) {
        groupedByDate[date] = 0;
      }
      groupedByDate[date] += Number(purchase.total);
    });
    const labels = Object.keys(groupedByDate);
    const data = Object.values(groupedByDate);

    const chartData = {
      labels,
      datasets: [
        {
          label: 'Monto Total de Compras',
          data,
          backgroundColor: '#36A2EB',
        },
      ],
    };

    const chartOptions: ChartConfiguration['options'] = {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: {
          display: true,
          text: 'Compras por Fecha',
        },
      },
    };

    const chartBuffer = await this.chartService.generateChart(
      'bar',
      chartData,
      chartOptions,
    );

    const pdfDefinition = await generatePDF(chartBuffer);

    const pdfDoc = await this.printerService.createPdf(pdfDefinition);

    return new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = [];
      pdfDoc.on('data', (chunk) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });
  }
}
