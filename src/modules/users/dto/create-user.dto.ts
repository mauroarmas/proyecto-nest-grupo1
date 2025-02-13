import { PartialType } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateUserDto {
  @IsNotEmpty({ message: i18nValidationMessage('errors.isNotEmpty') })
  @IsString({ message: i18nValidationMessage('errors.isString')})
  @MinLength(3, { message: i18nValidationMessage('errors.minLength', { value: 3 }) })
  @MaxLength(30, { message: i18nValidationMessage('errors.maxLength', { value: 30 }) })
  name: string;

  @IsNotEmpty({ message: i18nValidationMessage('errors.isNotEmpty') })
  @IsString({ message: i18nValidationMessage('errors.isString') })
  @MinLength(3, { message: i18nValidationMessage('errors.minLength', { value: 3 }) })
  @MaxLength(30, { message: i18nValidationMessage('errors.maxLength', { value: 30 }) })
  lastName: string;

  @IsNotEmpty({ message: i18nValidationMessage('errors.isNotEmpty') })
  @IsString({ message: i18nValidationMessage('errors.isString') })
  @MinLength(5, { message: i18nValidationMessage('errors.minLengthPhone', { value: 5 }) })
  @MaxLength(20, { message: i18nValidationMessage('errors.maxLengthPhone', { value: 20 }) })
  phone: string;

  @IsNotEmpty({ message: i18nValidationMessage('errors.isNotEmpty') })
  @IsEmail({}, { message: i18nValidationMessage('errors.isEmail') })
  email: string;

  @IsNotEmpty({ message: i18nValidationMessage('errors.isNotEmpty') })
  @IsString({ message: i18nValidationMessage('errors.isString') })
  @MinLength(8, { message: i18nValidationMessage('errors.minLength', { value: 8 }) })
  @MaxLength(30, { message: i18nValidationMessage('errors.maxLength', { value: 30 }) })
  password: string;

  @IsNotEmpty({ message: i18nValidationMessage('errors.isNotEmpty') })
  @IsString({ message: i18nValidationMessage('errors.isString') })
  @MinLength(10, { message: i18nValidationMessage('errors.minLength', { value: 10 }) })
  @MaxLength(100, { message: i18nValidationMessage('errors.maxLength', { value: 100 }) })
  address: string;

  @IsOptional()
  profileImg?: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}
