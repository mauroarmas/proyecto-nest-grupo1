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
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ 
    status: 201, 
    description: 'User created successfully',
    schema: {
      properties: {
        message: { type: 'string', example: 'User created successfully' },
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
  @ApiResponse({ status: 400, description: 'The email is already in use' })
  async register(@Body() user: CreateUserDto) {
    return await this.authService.register(user);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login' })
  @ApiBody({ type: LoginAuthDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Successful login',
    schema: {
      properties: {
        message: { type: 'string', example: 'Welcome {name}' },
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
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() credentials: LoginAuthDto) {
    return await this.authService.login(credentials);
  }

  @Post('recovery-password')
  @ApiOperation({ summary: 'Request password recovery' })
  @ApiBody({ type: RecoverPasswordDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Email recovery sent',
    schema: {
      properties: {
        message: { type: 'string', example: 'An email to recover the password has been sent' },
        status: { type: 'number', example: 200 }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async recoveryPassword(@Body() recoverDto: RecoverPasswordDto) {
    return await this.authService.recoveryPassword(recoverDto);
  }

  @Post('reset-password/:token')
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiParam({ 
    name: 'token', 
    required: true, 
    description: 'JWT token received by email' 
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Password updated successfully',
    schema: {
      properties: {
        message: { type: 'string', example: 'Password updated successfully' },
        status: { type: 'number', example: 200 }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resetPassword(
    @Param('token') token: string,
    @Body() resetDto: ResetPasswordDto,
  ) {
    return await this.authService.resetPasswordWithToken(resetDto, token);
  }
}
