import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUrl, IsUUID } from 'class-validator';

export class CreateProductImageDto {
    @ApiProperty({ description: 'URL de la imagen del producto', example: 'https://example.com/image.jpg' })
    @IsNotEmpty()
    @IsString()
    @IsUrl()
    url: string;

    @ApiProperty({ description: 'ID del producto asociado', example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsNotEmpty()
    @IsUUID()
    productId: string;
}
