import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ApiProperty } from '@nestjs/swagger';

export class LoginAuthDto {
  @IsEmail({}, { message: i18nValidationMessage('errors.isEmail') })
  @IsNotEmpty({ message: i18nValidationMessage('errors.isNotEmpty') })
  @ApiProperty({
    example: 'usuario@ejemplo.com',
    description: 'Email del usuario'
  })
  email: string;

  @IsString({ message: i18nValidationMessage('errors.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('errors.isNotEmpty') })
  @ApiProperty({
    example: 'contraseña123',
    description: 'Contraseña del usuario'
  })
  password: string;
}
