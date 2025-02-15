import { Controller, Post, Body, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RecoverPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { LoginAuthDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Usuario creado exitosamente',
    schema: {
      properties: {
        message: { type: 'string', example: 'Usuario creado con éxito' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            role: { type: 'string' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'El correo ya está en uso' })
  async register(@Body() user: CreateUserDto) {
    return await this.authService.register(user);
  }

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiBody({ type: LoginAuthDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Login exitoso',
    schema: {
      properties: {
        message: { type: 'string', example: 'Bienvenido {name}' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            role: { type: 'string' }
          }
        },
        token: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() credentials: LoginAuthDto) {
    return await this.authService.login(credentials);
  }

  @Post('recovery-password')
  @ApiOperation({ summary: 'Solicitar recuperación de contraseña' })
  @ApiBody({ type: RecoverPasswordDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Email de recuperación enviado',
    schema: {
      properties: {
        message: { type: 'string', example: 'Se ha enviado un correo de recuperación' },
        status: { type: 'number', example: 200 }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async recoveryPassword(@Body() recoverDto: RecoverPasswordDto) {
    return await this.authService.recoveryPassword(recoverDto);
  }

  @Post('reset-password/:token')
  @ApiOperation({ summary: 'Resetear contraseña usando token' })
  @ApiParam({ 
    name: 'token', 
    required: true, 
    description: 'Token JWT recibido por email' 
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Contraseña actualizada correctamente',
    schema: {
      properties: {
        message: { type: 'string', example: 'Contraseña actualizada correctamente' },
        status: { type: 'number', example: 200 }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Token inválido o expirado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async resetPassword(
    @Param('token') token: string,
    @Body() resetDto: ResetPasswordDto,
  ) {
    return await this.authService.resetPasswordWithToken(resetDto, token);
  }
}
