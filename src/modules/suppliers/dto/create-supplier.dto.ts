import { ApiProperty } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateSupplierDto {
  @ApiProperty({
    example: 'John Doe S.A.',
    description: 'Name of the supplier',
    type: String,
  })
  @IsNotEmpty({ message: i18nValidationMessage('errors.isNotEmpty') })
  @IsString({ message: i18nValidationMessage('errors.isString') })
  name: string;

  @IsNotEmpty({ message: i18nValidationMessage('errors.isNotEmpty') })
  @IsEmail({}, { message: i18nValidationMessage('errors.isEmail') })
  email: string;

  @IsNotEmpty({ message: i18nValidationMessage('errors.isNotEmpty') })
  @IsPhoneNumber('AR', {
    message: i18nValidationMessage('errors.isPhoneNumber'),
  })
  phone: string;

  @IsNotEmpty({ message: i18nValidationMessage('errors.isNotEmpty') })
  @IsString({ message: i18nValidationMessage('errors.isString') })
  taxId: string;

  @ApiProperty({
    example: [
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440111',
    ],
    description: 'Category ID associated with the supplier',
    type: [String],
  })
  @IsArray({ message: i18nValidationMessage('errors.isArray') })
  @IsUUID('4', { each: true, message: i18nValidationMessage('errors.isUUID') })
  @IsNotEmpty({ message: i18nValidationMessage('errors.isNotEmpty') })
  categories: string[];
}
