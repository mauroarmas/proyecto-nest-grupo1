import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsArray, IsUUID, Min, Max, MaxLength, MinLength, IsPositive } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateProductDto {
    @ApiProperty({
        example: 'Remera de algodón',
        description: 'Nombre del producto',
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
        description: 'Precio del producto (debe ser un número positivo)'
    })
    @IsNumber({}, { message: i18nValidationMessage('errors.isNumber') })
    @IsPositive({ message: i18nValidationMessage('errors.isPositive', { property: 'price' }) })
    price: number;

    @ApiProperty({
        example: 50,
        description: 'Cantidad de stock disponible (mínimo 0, máximo 10,000)'
    })
    @IsNumber({}, { message: i18nValidationMessage('errors.isNumber') })
    @Min(0, { message: i18nValidationMessage('errors.minValue', { value: 0, property: 'stock' }) })
    @Max(10000, { message: i18nValidationMessage('errors.maxValue', { value: 10000, property: 'stock' }) })
    stock: number;

    @ApiProperty({
        example: ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440111'],
        description: 'Lista de IDs de categorías asociadas',
        type: [String]
    })
    @IsArray()
    @IsUUID('4', { each: true, message: i18nValidationMessage('errors.isUUID') })
    categoryIds: string[];
}
