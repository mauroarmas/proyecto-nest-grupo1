import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsArray, IsUUID, Min, Max, MaxLength, MinLength, IsPositive } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateProductDto {
    @ApiProperty()
    @IsNotEmpty({ message: i18nValidationMessage('errors.isNotEmpty') })
    @IsString({ message: i18nValidationMessage('errors.isString') })
    @MaxLength(30, { message: i18nValidationMessage('errors.maxLength', { value: 30 }) })
    @MinLength(3, { message: i18nValidationMessage('errors.minLength', { value: 3 }) })
    name: string;

    @ApiProperty()
    @IsNumber({}, { message: i18nValidationMessage('errors.isNumber') })
    @IsPositive({ message: i18nValidationMessage('errors.isPositive', { property: 'price' }) })
    price: number;

    @ApiProperty()
    @IsNumber({}, { message: i18nValidationMessage('errors.isNumber') })
    @Min(0, { message: i18nValidationMessage('errors.minValue', { value: 0, property: 'stock' }) })
    @Max(10000, { message: i18nValidationMessage('errors.maxValue', { value: 10000, property: 'stock' }) })
    stock: number;

    @ApiProperty()
    @IsArray()
    @IsUUID('4', { each: true, message: i18nValidationMessage('errors.isUUID') })
    categoryIds: string[];
}
