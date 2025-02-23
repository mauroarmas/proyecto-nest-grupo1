import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateImgProductDto } from './dto/create-img-product.dto';
import { UpdateImgProductDto } from './dto/update-img-product.dto';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class ImgProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) { }

  async create(createImgProductDto: CreateImgProductDto) {
    const { url, productId } = createImgProductDto;

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(
        await this.i18n.translate('product.notFound'),
      );
    }

    return this.prisma.productImage.create({
      data: {
        url,
        productId,
      },
    });
  }

  async findAll() {
    return this.prisma.productImage.findMany({
      include: { product: true },
    });
  }

  async findOne(id: string) {
    const image = await this.prisma.productImage.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!image) {
      throw new NotFoundException(
        await this.i18n.translate('productImage.notFound'),
      );
    }

    return image;
  }

  async update(id: string, updateImgProductDto: UpdateImgProductDto) {
    const image = await this.prisma.productImage.findUnique({
      where: { id },
    });

    if (!image) {
      throw new NotFoundException(
        await this.i18n.translate('productImage.notFound'),
      );
    }

    return this.prisma.productImage.update({
      where: { id },
      data: updateImgProductDto,
    });
  }

  async remove(id: string) {
    const image = await this.prisma.productImage.findUnique({
      where: { id },
    });

    if (!image) {
      throw new NotFoundException(
        await this.i18n.translate('productImage.notFound'),
      );
    }

    return this.prisma.productImage.delete({ where: { id } });
  }
}
