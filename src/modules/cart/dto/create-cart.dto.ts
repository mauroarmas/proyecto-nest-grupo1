import { IsUUID, IsNumber, IsNotEmpty, IsArray, ArrayMinSize, IsString, IsOptional } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";
import { ApiProperty } from "@nestjs/swagger";
import { Discount } from "@prisma/client";

export class CreateCartLineDto {
  @ApiProperty({
    description: 'Product ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String
  })
  @IsUUID('4', { message: i18nValidationMessage('errors.isUUID') })
  @IsNotEmpty({ message: i18nValidationMessage('errors.isNotEmpty') })
  productId: string;

  @ApiProperty({
    description: 'Product quantity',
    example: 2,
    minimum: 1,
    type: Number
  })
  @IsNumber({}, { message: i18nValidationMessage('errors.isNumber') })
  @IsNotEmpty({ message: i18nValidationMessage('errors.isNotEmpty') })
  quantity: number;
}

export class CreateCartDto {
  @ApiProperty({
    description: 'List of products for the cart',
    type: [CreateCartLineDto],
    example: [{
      productId: '123e4567-e89b-12d3-a456-426614174000',
      quantity: 2
    }]
  })
  @IsArray({ message: i18nValidationMessage('errors.isArray') })
  @IsNotEmpty({ message: i18nValidationMessage('errors.isNotEmpty') })
  @ArrayMinSize(1, { message: i18nValidationMessage('errors.arrayMinSize') })
  cartLines: CreateCartLineDto[];
  
  @ApiProperty({
    description: 'Discount code applied to the cart',
    example: 'SUMMER2025',
    type: String
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('errors.isString') })
  discountCode?: string;
}
