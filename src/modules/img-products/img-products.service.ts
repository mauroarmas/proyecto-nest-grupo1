import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateImgProductDto } from './dto/create-img-product.dto';
import { UpdateImgProductDto } from './dto/update-img-product.dto';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { AwsService } from '../aws/aws.service';

@Injectable()
export class ImgProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly awsService: AwsService,
  ) { }

}
