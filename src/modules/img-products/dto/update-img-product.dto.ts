import { PartialType } from '@nestjs/swagger';
import { CreateImgProductDto } from './create-img-product.dto';

export class UpdateImgProductDto extends PartialType(CreateImgProductDto) {}
