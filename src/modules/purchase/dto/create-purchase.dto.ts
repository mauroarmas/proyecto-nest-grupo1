import { ApiProperty } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';
import {
  IsArray,
  IsNotEmpty,
  IsUUID,
  IsPositive,
  IsNumber,
} from 'class-validator';

export class CreatePurchaseLineDto {

  @ApiProperty({
    example: '462a55c3-1bd6-4ddf-bd8e-bf5c495ea8bb',
    description: 'Product ID associated with the purchase'
  })
  @IsUUID("4", { each: true, message: i18nValidationMessage('errors.isUUID') })
  @IsNotEmpty({ message: i18nValidationMessage('errors.isNotEmpty') })
  productId: string;

  @IsPositive() @IsPositive({ message: i18nValidationMessage('errors.isPositive', { property: 'quantity' }) })
  @IsNotEmpty({ message: i18nValidationMessage('errors.isNotEmpty') })
  quantity: number;

  @IsNumber({}, { message: i18nValidationMessage('errors.isNumber') })
  @IsNotEmpty({ message: i18nValidationMessage('errors.isNotEmpty') })
  subtotal: number;
}

export class CreatePurchaseDto {

  // @IsUUID("4", { each: true, message: i18nValidationMessage('errors.isUUID') })
  // @IsNotEmpty({ message: i18nValidationMessage('errors.isNotEmpty') })
  // userId: string;

  @IsUUID("4", { each: true, message: i18nValidationMessage('errors.isUUID') })
  @IsNotEmpty({ message: i18nValidationMessage('errors.isNotEmpty') })
  supplierId: string;

  @IsArray({ message: i18nValidationMessage('errors.isArray') })
  @IsNotEmpty({ message: i18nValidationMessage('errors.isNotEmpty') })
  purchaseLines: CreatePurchaseLineDto[];
}