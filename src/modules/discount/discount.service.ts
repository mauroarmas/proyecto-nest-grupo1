import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { CreateDiscountDto } from './dto/create-discount';

@Injectable()
export class DiscountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async create(createDiscountDto: CreateDiscountDto) {
    const { code, discount, duration } = createDiscountDto;

    // Validar si el código de descuento ya existe
    const existingDiscount = await this.prisma.discount.findUnique({
      where: { code },
    });

    if (existingDiscount) {
      throw new BadRequestException('Discount code already exists');
    }

    // Crear el descuento en la base de datos
    const newDiscount = await this.prisma.discount.create({
      data: {
        code,
        discount,
        duration,
      },
    });

    return newDiscount;
  }
}