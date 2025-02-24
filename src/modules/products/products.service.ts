import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) { }

  async create(newProduct: CreateProductDto) {
    const { name, price, stock, categoryIds, images, brandId, gender } = newProduct;

    // Buscar si el producto ya existe en la base de datos
    const existingProduct = await this.prisma.product.findFirst({ where: { name } });

    // Si el producto ya existe, aumentamos el stock
    if (existingProduct) {
      // Verificar si el stock a añadir es mayor a 0 para evitar valores negativos
      if (stock <= 0) {
        throw new ConflictException(await this.i18n.translate('product.invalidStock'));
      }
      // Actualizamos el producto con el nuevo stock sumado
      return this.prisma.product.update({
        where: { id: existingProduct.id },
        data: {
          stock: existingProduct.stock + stock, // Sumamos el stock existente con el nuevo
        },
      });
    }

    // Si el producto no existe, proceder con la creación de un nuevo producto
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });

    // Validar si todas las categorías enviadas existen en la base de datos
    if (categories.length !== categoryIds.length) {
      throw new NotFoundException(await this.i18n.translate('product.categoryNotFound'));
    }

    // Crear el nuevo producto en la base de datos
    return this.prisma.product.create({
      data: {
        name,
        price, 
        stock,
        gender: 'UNISEX', //Prueba
        brandId: '1', //prueba
        categories: { create: categoryIds.map(id => ({ categoryId: id })) }, // Crear relaciones con las categorías
        images: { create: images.map(url => ({ url })) }, // Crear relaciones con las imágenes
      },
    });
  }

  // Obtener todos los productos
  async findAll() {
    return this.prisma.product.findMany({
      include: { categories: true, images: true, brand: true }, // Incluir las relaciones con categorías, imágenes y marca
    });
  }

  // Obtener un solo producto por ID
  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { categories: true, images: true, brand: true }, // Incluir las relaciones con categorías, imágenes y marca
    });

    // Si no se encuentra el producto, lanzar una excepción
    if (!product) {
      throw new NotFoundException(await this.i18n.translate('product.notFound'));
    }
    return product;
  }

  // Actualizar un producto por ID
  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    // Si no se encuentra el producto, lanzar una excepción
    if (!product) {
      throw new NotFoundException(await this.i18n.translate('product.notFound'));
    }

    const { categoryIds, images, ...updateData } = updateProductDto;

    return this.prisma.product.update({
      where: { id },
      data: {
        ...updateData, // Actualizar los datos generales del producto
        categories: categoryIds
          ? {
            deleteMany: {}, // Eliminar relaciones anteriores con categorías
            create: categoryIds.map(categoryId => ({ categoryId })), // Crear nuevas relaciones con categorías
          }
          : undefined,
        images: images
          ? {
            deleteMany: {}, // Eliminar imágenes anteriores
            create: images.map(url => ({ url })), // Crear nuevas imágenes
          }
          : undefined,
      },
      include: {
        categories: true, // Incluir las categorías relacionadas
        images: true, // Incluir las imágenes relacionadas
      },
    });
  }

  // Eliminar un producto por ID
  async remove(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });

    // Si no se encuentra el producto, lanzar una excepción
    if (!product) {
      throw new NotFoundException(await this.i18n.translate('product.notFound'));
    }

    // Eliminar el producto de la base de datos
    return this.prisma.product.delete({ where: { id } });
  }
}