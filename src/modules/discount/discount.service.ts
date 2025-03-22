import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { CreateDiscountDto } from './dto/create-discount';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class DiscountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async findAll() {
    return await this.prisma.discount.findMany({ where: {
      isDeleted: false
    }});
  }

  async findOne(code: string) {
    const discount = await this.prisma.discount.findUnique({ where: { code }  });
    if (!discount) {
      throw new NotFoundException('Discount not found');
    }
    return discount;
  }

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
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + duration);

    // Crear el descuento en la base de datos con fecha de expiración
    const newDiscount = await this.prisma.discount.create({
      data: {
        code,
        discount,
        duration,
        expiresAt, // Guardamos la fecha de expiración
      },
    });

    return newDiscount;
  }

  @Cron('0 0 * * *') // Ejecuta la tarea todos los días a la medianoche
  async handleDuration() {
    const today = new Date();

    // Buscar descuentos que han expirado
    const expiredDiscounts = await this.prisma.discount.findMany({
      where: {
        expiresAt: { lte: today }, // Busca los que ya deberían expirar
      },
    });

    if (expiredDiscounts.length === 0) {
      return;
    }

    // Eliminar descuentos expirados
    const discountIds = expiredDiscounts.map((d) => d.id);
    await this.prisma.discount.deleteMany({
      where: { id: { in: discountIds } },
    });
  }

  async deleteDiscount(id: string) {
    // Verifica si el descuento existe antes de eliminarlo
    const discount = await this.prisma.discount.findUnique({
      where: { id },
    });

    if (!discount) {
      throw new NotFoundException(`Discount with ID ${id} not found`);
    }

    const updatedDiscount = await this.prisma.discount.update({
      where: { id: id },
      data: { isDeleted: true },
    });

    return updatedDiscount;
  }
}
