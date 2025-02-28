import { IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateBrandDto {
    @ApiProperty({
        description: 'The name of the brand',
        example: 'Brand Name',
    })
    @IsNotEmpty({ message: i18nValidationMessage('errors.isNotEmpty') })
    @IsString({ message: i18nValidationMessage('errors.isString') })
    @MaxLength(30, { message: i18nValidationMessage('errors.maxLength', { value: 30 }) })
    @MinLength(3, { message: i18nValidationMessage('errors.minLength', { value: 3 }) })
    name: string;
}