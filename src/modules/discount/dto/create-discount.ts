import { IsString, IsNotEmpty, IsNumber, IsPositive, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDiscountDto {
  @ApiProperty({
    description: 'Discount code, unique identifier for the discount',
    example: 'SUMMER2025',
    type: String,
  })
  @IsString()
  @IsNotEmpty({ message: 'Discount code should not be empty' })
  code: string;

  @ApiProperty({
    description: 'Discount amount in percentage (0-100)',
    example: 20,
    type: Number,
  })
  @IsNumber()
  @IsPositive({ message: 'Discount must be a positive number' })
  @Min(1, { message: 'Discount should be at least 1%' })
  discount: number;

  @ApiProperty({
    description: 'Duration of the discount in days',
    example: 30,
    type: Number,
  })
  @IsInt({ message: 'Duration must be an integer' })
  @IsPositive({ message: 'Duration must be positive' })
  duration: number;
}