import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateImgProductDto } from './dto/create-img-product.dto';
import { UpdateImgProductDto } from './dto/update-img-product.dto';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { AwsService } from '../aws/aws.service';
import { translate } from 'src/utils/translation';

@Injectable()
export class ImgProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly awsService: AwsService,
  ) {}

  async uploadImgProduct(
    files: Express.Multer.File[],
    productId: string,) {

      const validExtensions = ['jpg', 'webp', 'png', 'gif', 'tiff', 'bmp', 'svg'];
    const maxFileSize = 1.5 * 1024 * 1024; // 1.5 MB

    const fileExtensions: string[] = files.map(file => file.originalname.split('.').pop().toLowerCase());
    if (fileExtensions.some(ext => !validExtensions.includes(ext))) {
      throw new BadRequestException(translate(this.i18n, 'messages.invalidFileExtension'));
    }

    if (files.some(file => file.size > maxFileSize)) {
      throw new BadRequestException(translate(this.i18n, 'messages.fileTooLarge'));
    }
    if (files.length === 0) {
      throw new BadRequestException(translate(this.i18n, 'messages.noFilesUploaded'));
    }
   
    const uploadResults = await Promise.all(
      files.map(file => this.awsService.uploadFile(file, productId))
    );
    const urls = uploadResults.map(result => result.url);
  
  
     const getProduct = await this.prisma.product.findUnique({
        where: { id: productId },
        include: { images: true },
      });    
  
    if (!getProduct) {
      throw new NotFoundException(translate(this.i18n, 'messages.ProductNotFound'));
    }
  
    if (getProduct.images.length >= 5) {
      throw new BadRequestException(translate(this.i18n, 'messages.mountOfImages'));
    }
    
    try {
     const product = await this.prisma.product.update({
       where: { id: productId },
       data: { images: { create: urls.map(url => ({ url })) } },
     })
  
     return { product, message: translate(this.i18n, 'messages.uploadImages') };
 
    } catch (error) {
      throw new BadRequestException('Error uploading file', error);
    }
  }
}
