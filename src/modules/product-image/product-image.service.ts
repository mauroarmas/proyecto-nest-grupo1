import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductImageDto } from './dto/create-product-image.dto';
import { UpdateProductImageDto } from './dto/update-product-image.dto';

@Injectable()
export class ProductImageService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createProductImageDto: CreateProductImageDto) {
    return await this.prisma.productImage.create({
      data: createProductImageDto,
    });
  }

  async findAll() {
    return await this.prisma.productImage.findMany({
      where: { isDeleted: false },
      include: { product: true },
    });
  }

  async findOne(id: string) {
    const productImage = await this.prisma.productImage.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!productImage) {
      throw new NotFoundException(`Imagen con ID ${id} no encontrada`);
    }

    return productImage;
  }

  async update(id: string, updateProductImageDto: UpdateProductImageDto) {
    const productImage = await this.prisma.productImage.findUnique({ where: { id } });
    if (!productImage) {
      throw new NotFoundException(`Imagen con ID ${id} no encontrada`);
    }

    return await this.prisma.productImage.update({
      where: { id },
      data: updateProductImageDto,
    });
  }

  async remove(id: string) {
    const productImage = await this.prisma.productImage.findUnique({ where: { id } });
    if (!productImage) {
      throw new NotFoundException(`Imagen con ID ${id} no encontrada`);
    }

    return await this.prisma.productImage.update({
      where: { id },
      data: { isDeleted: true },
    });
  }
}
