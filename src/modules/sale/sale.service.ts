import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateSaleDto } from './dto/create-sale.dto';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { PaginationArgs } from 'src/utils/pagination/pagination.dto';
import { Prisma } from '@prisma/client';
import { getPaginationFilter } from 'src/utils/pagination/pagination.utils';
import { paginate } from 'src/utils/pagination/parsing';
import { ExcelService } from '../excel/excel.service';
import { ExcelColumn } from 'src/common/interfaces';
import { Response } from 'express';
import { PrinterService } from '../printer/printer.service';
import { generateBillPDF } from '../printer/documents/index';
import { MessagingService } from '../messaging/messaging.service';
import { getMessagingConfig } from 'src/common/constants';
import { ConfigService } from '@nestjs/config';
import { ChartService } from '../chart/chart.service';
import { generatePDFBestSeller } from '../printer/documents/sellsAndBSProducts';
import { ChartConfiguration } from 'chart.js';
import { generatePDFSells } from '../printer/documents/sellsAndBSProducts';


@Injectable()
export class SaleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly excelService: ExcelService,
    private readonly printerService: PrinterService,
    private messagingService: MessagingService,
    private configService: ConfigService,
    private readonly chartService: ChartService,
  ) {}

  async create(createSaleDto: CreateSaleDto, res: Response) {
    try {
      const cart = await this.prisma.cart.findUnique({
        where: { id: createSaleDto.cartId },
      });

      if (!cart) {
        throw new HttpException(
          await this.i18n.translate('messages.cartNotFound'),
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.prisma.cart.update({
        where: { id: cart.id },
        data: { status: 'completed' },
      });

      const sale = await this.prisma.sale.create({
        data: {
          cart: { connect: { id: cart.id } },
          date: new Date(Date.now()),
        },
        include: { cart: true },
      });

      const user = await this.prisma.user.findUnique({
        where: { id: cart.userId },
      });


      return await this.getBill(sale.id, res, user.email);
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
  
      // Filtros de fecha corregidos
      let dateFilter: Prisma.SaleWhereInput = {};
  
      if (startDate && endDate) {
        dateFilter.createdAt = {
          gte: new Date(`${startDate}T00:00:00.000Z`),
          lte: new Date(`${endDate}T23:59:59.999Z`),
        };
      } else if (date) {
        const startOfDay = new Date(`${date}T00:00:00.000Z`);
        const endOfDay = new Date(`${date}T23:59:59.999Z`);
  
        dateFilter.createdAt = {
          gte: startOfDay,
          lte: endOfDay,
        };
      }
  
      const where: Prisma.SaleWhereInput = {
        isDeleted: false,
        ...dateFilter,
        ...(search && {
          OR: [
            {
              cartId: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        }),
      };
  
      const baseQuery = {
        where,
        ...getPaginationFilter(pagination),
        include: { cart: true },
      };
  
      const total = await this.prisma.sale.count({ where });
      const sales = await this.prisma.sale.findMany(baseQuery);
      const res = paginate(sales, total, pagination);
  
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
      const sale = await this.prisma.sale.findUnique({
        where: { id },
        include: { cart: true },
      });

      if (!sale) {
        throw new HttpException(
          await this.i18n.translate('messages.saleNotFound'),
          HttpStatus.NOT_FOUND,
        );
      }

      return sale;
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

  async findAllByUser(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new HttpException(
          await this.i18n.translate('messages.userNotFound'),
          HttpStatus.NOT_FOUND,
        );
      }

      return this.prisma.sale.findMany({
        where: {
          cart: {
            userId,
          },
        },
        include: { cart: true },
      });
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
      const sales = await this.prisma.sale.findMany({
        where: { isDeleted: false },
        include: { cart: true },
      });

      const columns: ExcelColumn[] = [
        { header: 'Venta', key: 'id' },
        { header: 'Usuario', key: 'user' },
        { header: 'Carrito', key: 'cartId' },
        { header: 'Total', key: 'total' },
        { header: 'Fecha', key: 'createdAt' },
      ];

      const formattedSales = sales.map((sale) => ({
        id: sale.id,
        user: sale.cart.userId,
        cartId: sale.cartId,
        total: sale.cart.total,
        createdAt: sale.createdAt,
      }));

      const workbook = await this.excelService.generateExcel(
        formattedSales,
        columns,
        'Ventas',
      );
      await this.excelService.exportToResponse(res, workbook, 'sales.xlsx');
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

  async getBill(saleId: string, res: Response, email?: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        cart: {
          include: { cartLines: { include: { product: true } }, user: true },
        },
      },
    });
  
    if (!sale) {
      throw new HttpException('Venta no encontrada', HttpStatus.NOT_FOUND);
    }
  
    const docDefinition = await generateBillPDF(sale, sale.cart);
    const pdfDoc = await this.printerService.createPdf(docDefinition);
  
    // Convertir PDF a Buffer para adjuntarlo
    const pdfBuffer: Buffer = await new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });
  
    // Enviar el PDF como archivo adjunto por email
    if (email) {
      const messagingConfig = getMessagingConfig(this.configService);
      await this.messagingService.sendBillSale({
        from: messagingConfig.emailSender,
        to: email,
        subject: 'Factura de compra',
        body: 'Adjunto encontrarás tu factura en formato PDF.',
        attachments: [
          {
            filename: `factura-${sale.id}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });
    }
  
    // Enviar el PDF como respuesta HTTP
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="factura-${sale.id}.pdf"`,
    );
    res.send(pdfBuffer);
  }

  async generateSellsBarChart(): Promise<Buffer> {
    const sales = await this.prisma.sale.findMany({
      // where: { status: 'completed' },
      // select: { id: true, total: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
      include: { cart: true },
    });

    // console.log(purchases);
    const groupedByDate = {};

    sales.forEach((sale) => {
      const date = sale.createdAt.toISOString().split('T')[0];
      if (!groupedByDate[date]) {
        groupedByDate[date] = 0;
      }
      groupedByDate[date] += Number(sale.cart.total);
    });
    const labels = Object.keys(groupedByDate);
    const data = Object.values(groupedByDate);

    console.log(groupedByDate);
    console.log(labels);
    console.log(data);

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

    const pdfDefinition = await generatePDFSells(chartBuffer);

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
