import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';

export class CreateCategoryDto {
    @ApiProperty({ description: 'Nombre de la categoría', example: 'Indumentaria femenina' })
    @IsNotEmpty()
    @IsString()
    @Length(3, 50)
    name: string;
}