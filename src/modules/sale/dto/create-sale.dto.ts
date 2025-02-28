import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateSaleDto {
  @ApiProperty({
    example: '325c67d4-8b10-4c19-b46b-9980aafa3e45',
    description: 'ID of the cart associated with the sale',
    type: String,
  })
  @IsUUID('4', { each: true, message: i18nValidationMessage('errors.isUUID') })
  @IsNotEmpty({ message: i18nValidationMessage('errors.isNotEmpty') })
  cartId: string;
}
