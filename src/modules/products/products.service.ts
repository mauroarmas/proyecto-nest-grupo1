import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(newProduct: CreateProductDto) {
    const existingProduct = await this.prisma.product.findFirst({
      where: { name: newProduct.name },
    });

    if (existingProduct) {
      return this.prisma.product.update({
        where: { id: existingProduct.id },
        data: { stock: { increment: newProduct.stock } },
      });
    }

    const categoryExists = await this.prisma.category.findUnique({
      where: { id: newProduct.categoryId },
    });

    if (!categoryExists) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return this.prisma.product.create({
      data: {
        name: newProduct.name,
        price: newProduct.price,
        stock: newProduct.stock,
        categories: {
          create: { category: { connect: { id: newProduct.categoryId } } },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      include: { categories: true, images: true },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { categories: true, images: true },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    return this.prisma.product.delete({ where: { id } });
  }
}