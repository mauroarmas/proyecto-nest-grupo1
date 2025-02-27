import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class BrandService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) { }

  async create(createBrandDto: CreateBrandDto) {
    const { name } = createBrandDto;

    const existingBrands = await this.prisma.brand.findMany({
      where: { name },
    });

    if (existingBrands.length > 0) {
      throw new BadRequestException(this.i18n.translate('messages.duplicateBrand'));
    }

    return this.prisma.brand.create({
      data: { name },
    });
  }

  async findAll() {
    return this.prisma.brand.findMany();
  }

  async findOne(id: string) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) {
      throw new BadRequestException(this.i18n.translate('messages.brandNotFound'));
    }
    return brand;
  }

  async update(id: string, updateBrandDto: UpdateBrandDto) {
    const { name } = updateBrandDto;

    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) {
      throw new BadRequestException(this.i18n.translate('messages.brandNotFound'));
    }

    const existingBrands = await this.prisma.brand.findMany({
      where: { name },
    });

    if (existingBrands.length > 0 && existingBrands[0].id !== id) {
      throw new BadRequestException(this.i18n.translate('messages.duplicateBrand'));
    }

    return this.prisma.brand.update({
      where: { id },
      data: { name },
    });
  }

  async remove(id: string) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) {
      throw new BadRequestException(this.i18n.translate('messages.brandNotFound'));
    }

    return this.prisma.brand.delete({ where: { id } });
  }
}