import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateImgProductDto {
    @ApiProperty({
        example: 'https://example.com/image.jpg',
        description: 'URL de la imagen del producto',
    })
    @IsNotEmpty({ message: i18nValidationMessage('errors.isNotEmpty') })
    @IsString({ message: i18nValidationMessage('errors.isString') })
    url: string;

    @ApiProperty({
        example: '1b443cd8-e890-4d25-bdb9-39e0b3a5efb0',
        description: 'ID del producto al que se asigna la imagen',
    })
    @IsNotEmpty({ message: i18nValidationMessage('errors.isNotEmpty') })
    @IsUUID('4', { message: i18nValidationMessage('errors.isUUID') })
    productId: string;
}
