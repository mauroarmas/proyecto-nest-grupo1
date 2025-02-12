import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsUUID, IsNotEmpty, MinLength, MaxLength, IsPositive, Min, Max } from 'class-validator';

export class CreateProductDto {
    @ApiProperty({ description: 'Nombre del producto', example: 'Remera' })
    @IsNotEmpty()
    @IsString()
    @MinLength(3)
    @MaxLength(100)
    name: string;

    @ApiProperty({ description: 'Precio del producto', example: 1500.99 })
    @IsNotEmpty()
    @IsPositive()
    @IsNumber()
    price: number;

    @ApiProperty({ description: 'Stock disponible', example: 25 })
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    @Max(10000)
    stock: number;

    @ApiProperty({ description: 'ID de la categoría', example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsNotEmpty()
    @IsUUID()
    categoryId: string;
}
