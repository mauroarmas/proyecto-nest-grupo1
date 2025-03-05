import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class RecoverPasswordDto {
  @ApiProperty({
    example: 'usuario@ejemplo.com',
    description: 'User email'
  })
  @IsEmail({},{ message: i18nValidationMessage('validation.INVALID_EMAIL') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.NOT_EMPTY') })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    example: 'newPassword123',
    description: 'New password',
    minLength: 6
  })
  @IsString({ message: i18nValidationMessage('validation.INVALID_STRING') })
  @MinLength(6, { message: i18nValidationMessage('validation.MIN_LENGTH') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.NOT_EMPTY') })
  password: string;

  @ApiProperty({
    example: 'newPassword123',
    description: 'Confirmation of the new password',
    minLength: 6
  })
  @IsString({ message: i18nValidationMessage('validation.INVALID_STRING') })
  @MinLength(6, { message: i18nValidationMessage('validation.MIN_LENGTH') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.NOT_EMPTY') })
  confirmPassword: string;
}
