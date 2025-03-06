import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class RecoverPasswordDto {
  @ApiProperty({
    example: 'usuario@ejemplo.com',
    description: 'User email'
  })
  @IsEmail({}, { message: i18nValidationMessage('errors.isEmail') })
  @IsNotEmpty({ message: i18nValidationMessage('errors.isNotEmpty') })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    example: 'newPassword123',
    description: 'New password',
    minLength: 6
  })
  @IsNotEmpty({ message: i18nValidationMessage('errors.isNotEmpty') })
  @IsString({ message: i18nValidationMessage('errors.isString') })
  @MaxLength(30, { message: i18nValidationMessage('errors.maxLength', { value: 30 }) })
  @MinLength(6, { message: i18nValidationMessage('errors.minLength', { value: 6 }) })
  password: string;

  @ApiProperty({
    example: 'newPassword123',
    description: 'Confirmation of the new password',
    minLength: 6
  })
  @IsNotEmpty({ message: i18nValidationMessage('errors.isNotEmpty') })
  @IsString({ message: i18nValidationMessage('errors.isString') })
  @MaxLength(30, { message: i18nValidationMessage('errors.maxLength', { value: 30 }) })
  @MinLength(6, { message: i18nValidationMessage('errors.minLength', { value: 6 }) })
  confirmPassword: string;
}
