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

@Injectable()
export class SaleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly excelService: ExcelService,
    private readonly printerService: PrinterService,
    private messagingService: MessagingService,
    private configService: ConfigService,
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
      const dateObj = new Date(date);

      const where: Prisma.SaleWhereInput = {
        isDeleted: false,
        ...(search && {
          OR: [
            {
              cartId: {
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
        include: { cart: true },
        ...getPaginationFilter(pagination),
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
}
