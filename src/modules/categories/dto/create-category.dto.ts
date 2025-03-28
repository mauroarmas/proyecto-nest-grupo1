import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsUUID, MaxLength, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateCategoryDto {
    @ApiProperty({
        example: 'womens clothing',
        description: 'Name of the category',
        type: String,
        maxLength: 30,
        minLength: 3
    })
    @IsNotEmpty({ message: i18nValidationMessage('errors.isNotEmpty') })
    @IsString({ message: i18nValidationMessage('errors.isString') })
    @MaxLength(30, { message: i18nValidationMessage('errors.maxLength', { value: 30 }) })
    @MinLength(3, { message: i18nValidationMessage('errors.minLength', { value: 3 }) })
    name: string;

    @ApiProperty({
        example: ['550e8400-e29b-41d4-a716-446655440000'],
        description: 'List of product IDs',
        type: [String]
    })
    @IsArray()
    @IsUUID("4", { each: true, message: i18nValidationMessage('errors.isUUID') })
    productIds: string[];
}