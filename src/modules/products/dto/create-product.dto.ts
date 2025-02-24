import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsArray, IsUUID, Min, Max, MaxLength, MinLength, IsPositive, IsEnum, IsOptional } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { Gender } from '@prisma/client';

export class CreateProductDto {
    @ApiProperty({
        example: 'Basic T-shirt',
        description: 'Product name',
        maxLength: 30,
        minLength: 3
    })
    @IsNotEmpty({ message: i18nValidationMessage('errors.isNotEmpty') })
    @IsString({ message: i18nValidationMessage('errors.isString') })
    @MaxLength(30, { message: i18nValidationMessage('errors.maxLength', { value: 30 }) })
    @MinLength(3, { message: i18nValidationMessage('errors.minLength', { value: 3 }) })
    name: string;

    @ApiProperty({
        example: 4999.99,
        description: 'Product price'
    })
    @IsNumber({}, { message: i18nValidationMessage('errors.isNumber') })
    @IsPositive({ message: i18nValidationMessage('errors.isPositive', { property: 'price' }) })
    price: number;

    @ApiProperty({
        example: 50,
        description: 'Stock of the product'
    })
    @IsNumber({}, { message: i18nValidationMessage('errors.isNumber') })
    @Min(0, { message: i18nValidationMessage('errors.minValue', { value: 0, property: 'stock' }) })
    @Max(10000, { message: i18nValidationMessage('errors.maxValue', { value: 10000, property: 'stock' }) })
    stock: number;

    @ApiProperty({
        example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        description: 'List of image URLs associated with the product',
        type: [String]
    })
    @IsArray()
    @IsOptional()
    images?: string[];

    @ApiProperty({
        example: ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440111'],
        description: 'List of category IDs associated with the product',
        type: [String]
    })
    @IsArray()
    @IsUUID('4', { each: true, message: i18nValidationMessage('errors.isUUID') })
    categoryIds: string[];

    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Brand ID associated with the product'
    })
    @IsUUID('4', { message: i18nValidationMessage('errors.isUUID') })
    brandId: string;

    @ApiProperty({
        example: Gender.UNISEX,
        description: 'Gender associated with the product',
        enum: Gender
    })
    @IsEnum(Gender, { message: i18nValidationMessage('errors.isEnum') })
    gender: Gender;
}