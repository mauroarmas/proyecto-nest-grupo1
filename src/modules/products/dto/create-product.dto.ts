import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsPositive, IsArray, IsUUID, Min, Max, MaxLength } from 'class-validator';

export class CreateProductDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    @MaxLength(250)
    name: string;

    @ApiProperty()
    @IsNumber()
    price: number;

    @ApiProperty()
    @IsNumber()
    @Min(0)
    @Max(10000)
    stock: number;

    @ApiProperty()
    @IsArray()
    @IsUUID('4', { each: true })
    categoryIds: string[];
}
