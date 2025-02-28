import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RecoverPasswordDto {
  @ApiProperty({
    example: 'usuario@ejemplo.com',
    description: 'Email del usuario'
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    example: 'nuevaContraseña123',
    description: 'Nueva contraseña',
    minLength: 6
  })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    example: 'nuevaContraseña123',
    description: 'Confirmación de la nueva contraseña',
    minLength: 6
  })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  confirmPassword: string;
}
