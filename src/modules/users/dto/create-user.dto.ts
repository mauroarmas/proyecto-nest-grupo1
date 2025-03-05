import { ApiProperty, PartialType } from '@nestjs/swagger';
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
  @ApiProperty({
    description: 'User name',
    example: 'John'
  })
  @IsNotEmpty({ message: i18nValidationMessage('errors.isNotEmpty') })
  @IsString({ message: i18nValidationMessage('errors.isString') })
  @MinLength(3, { message: i18nValidationMessage('errors.minLength', { value: 3 }) })
  @MaxLength(30, { message: i18nValidationMessage('errors.maxLength', { value: 30 }) })
  name: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe'
  })
  @IsNotEmpty({ message: i18nValidationMessage('errors.isNotEmpty') })
  @IsString({ message: i18nValidationMessage('errors.isString') })
  @MinLength(3, { message: i18nValidationMessage('errors.minLength', { value: 3 }) })
  @MaxLength(30, { message: i18nValidationMessage('errors.maxLength', { value: 30 }) })
  lastName: string;

  @ApiProperty({
    description: 'User phone',
    example: '1234567890'
  })
  @IsNotEmpty({ message: i18nValidationMessage('errors.isNotEmpty') })
  @IsString({ message: i18nValidationMessage('errors.isString') })
  @MinLength(5, { message: i18nValidationMessage('errors.minLengthPhone', { value: 5 }) })
  @MaxLength(20, { message: i18nValidationMessage('errors.maxLengthPhone', { value: 20 }) })
  phone: string;

  @ApiProperty({
    description: 'User email',
    example: 'nNk0f@example.com'
  })
  @IsNotEmpty({ message: i18nValidationMessage('errors.isNotEmpty') })
  @IsEmail({}, { message: i18nValidationMessage('errors.isEmail') })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123'
  })
  @IsNotEmpty({ message: i18nValidationMessage('errors.isNotEmpty') })
  @IsString({ message: i18nValidationMessage('errors.isString') })
  @MinLength(8, { message: i18nValidationMessage('errors.minLength', { value: 8 }) })
  @MaxLength(30, { message: i18nValidationMessage('errors.maxLength', { value: 30 }) })
  password: string;

  @ApiProperty({
    description: 'User address',
    example: '1234 Example St'
  })
  @IsNotEmpty({ message: i18nValidationMessage('errors.isNotEmpty') })
  @IsString({ message: i18nValidationMessage('errors.isString') })
  @MinLength(10, { message: i18nValidationMessage('errors.minLength', { value: 10 }) })
  @MaxLength(100, { message: i18nValidationMessage('errors.maxLength', { value: 100 }) })
  address: string;

  @ApiProperty({
    description: 'User profile image',
    example: 'https://example.com/profile.jpg',
    required: false
  })
  @IsOptional()
  profileImg?: string;

  @ApiProperty({
    description: 'User biography',
    example: 'I am a software developer',
    required: false
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('errors.isString') })
  @MaxLength(1000, { message: i18nValidationMessage('errors.maxLength', { value: 1000 }) })
  bio?: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) { }
