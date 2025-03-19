import {
  Injectable,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginAuthDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/common/interfaces';
import { comparePassword, hashPassword } from 'src/utils/encryption';
import { MessagingService } from '../messaging/messaging.service';
import { getMessagingConfig } from 'src/common/constants';
import { RecoverPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { I18nService } from 'nestjs-i18n';
import { ConfigService } from '@nestjs/config';
import { GoogleUserDTO } from './dto/oauth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private messagingService: MessagingService,
    private readonly i18n: I18nService,
    private configService: ConfigService,
  ) { }

  async register(user: CreateUserDto) {
    try {
      const userEmail = user.email.toString().toLowerCase();
      user.email = userEmail;
      const findUser = await this.prisma.user.findUnique({
        where: {
          email: user.email,
        },
      });

      if (findUser) {
        throw new HttpException(
          await this.i18n.translate('messages.existingMail'),
          HttpStatus.BAD_REQUEST,
        );
      }

      const newUser = await this.prisma.user.create({
        data: {
          ...user,
          password: await hashPassword(user.password),
          profile: {
            create: {
              bio: user.bio || '',
            },
          },
        },
      });

      const messagingConfig = getMessagingConfig(this.configService);
      await this.messagingService.sendRegisterUserEmail({
        from: messagingConfig.emailSender,
        to: user.email,
      });

      return {
        message: await this.i18n.translate('messages.userCreated'),
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        await this.i18n.translate('messages.serverError', {
          args: { error: error.message },
        }),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async login(credentials: LoginAuthDto) {
    try {
      const { password } = credentials;
      const email = credentials.email.toString().toLowerCase();
      const findUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!findUser) {
        throw new HttpException(
          await this.i18n.translate('messages.invalidCredentials'),
          HttpStatus.UNAUTHORIZED,
        );
      }

      if (findUser.isDeleted) {
        throw new HttpException(
          await this.i18n.translate('messages.userDeleted'),
          HttpStatus.UNAUTHORIZED,
        );
      }

      const isCorrectPassword = await comparePassword(
        password,
        findUser.password,
      );

      if (!isCorrectPassword) {
        throw new HttpException(
          await this.i18n.translate('messages.invalidCredentials'),
          HttpStatus.UNAUTHORIZED,
        );
      }

      const payload: JwtPayload = {
        id: findUser.id,
        email: findUser.email,
        role: findUser.role,
      };

      const token = await this.createTokens(payload);

      return {
        message: await this.i18n.translate('messages.welcome', {
          args: { name: findUser.name },
        }),
        user: {
          id: findUser.id,
          email: findUser.email,
          name: findUser.name,
          role: findUser.role,
        },
        token,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        await this.i18n.translate('messages.serverError'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async recoveryPassword(recoverDto: RecoverPasswordDto) {
    try {
      const { email } = recoverDto;
      const findUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!findUser) {
        throw new HttpException(
          await this.i18n.translate('messages.userNotFound'),
          HttpStatus.NOT_FOUND,
        );
      }

      const payload: JwtPayload = {
        id: findUser.id,
        email: findUser.email,
        role: findUser.role,
      };

      const { accessToken } = await this.createTokens(payload, '1h');

      const cleanToken = accessToken.replace('Bearer ', '');

      const messagingConfig = getMessagingConfig(this.configService);
      await this.messagingService.sendRecoveryPassword({
        from: messagingConfig.emailSender,
        to: findUser.email,
        url: `${messagingConfig.resetPasswordUrls.backoffice}/${cleanToken}`,
      });

      return {
        message: await this.i18n.translate('messages.recoveryEmailSent'),
        status: HttpStatus.OK,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        await this.i18n.translate('messages.serverError'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async resetPassword(resetDto: ResetPasswordDto, id: string) {
    try {
      console.log('Attempting reset password for user ID:', id);
      const { password, confirmPassword } = resetDto;

      if (password !== confirmPassword) {
        throw new HttpException(
          await this.i18n.translate('messages.passwordsDoNotMatch'),
          HttpStatus.BAD_REQUEST,
        );
      }

      const findUser = await this.prisma.user.findUnique({
        where: {
          id,
          isDeleted: false,
        },
      });

      console.log('Found user:', findUser ? 'yes' : 'no');

      if (!findUser) {
        throw new HttpException(
          await this.i18n.translate('messages.userNotFound'),
          HttpStatus.NOT_FOUND,
        );
      }

      await this.prisma.user.update({
        where: { id },
        data: {
          password: await hashPassword(password),
        },
      });

      return {
        message: await this.i18n.translate('messages.passwordUpdated'),
        status: HttpStatus.OK,
      };
    } catch (error) {
      console.error('Reset password error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        await this.i18n.translate('messages.serverError'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async resetPasswordWithToken(resetDto: ResetPasswordDto, token: string) {
    try {
      console.log('Token recibido:', token);
      const { password, confirmPassword } = resetDto;

      if (password !== confirmPassword) {
        throw new HttpException(
          await this.i18n.translate('messages.passwordsDoNotMatch'),
          HttpStatus.BAD_REQUEST,
        );
      }

      let decodedToken;
      try {
        const cleanToken = token.trim().replace(/\.$/, '');
        console.log('Token limpio:', cleanToken);

        decodedToken = await this.jwtService.verifyAsync(cleanToken);
        console.log('Token decodificado:', decodedToken);
      } catch (error) {
        console.error('Error al verificar token:', error);
        throw new HttpException(
          await this.i18n.translate('messages.invalidOrExpiredToken'),
          HttpStatus.UNAUTHORIZED,
        );
      }

      const findUser = await this.prisma.user.findUnique({
        where: {
          id: decodedToken.id,
          isDeleted: false,
        },
      });

      console.log('Found user:', findUser ? 'yes' : 'no');

      if (!findUser) {
        throw new HttpException(
          await this.i18n.translate('messages.userNotFound'),
          HttpStatus.NOT_FOUND,
        );
      }

      await this.prisma.user.update({
        where: { id: decodedToken.id },
        data: {
          password: await hashPassword(password),
        },
      });

      return {
        message: await this.i18n.translate('messages.passwordUpdated'),
        status: HttpStatus.OK,
      };
    } catch (error) {
      console.error('Reset password error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        await this.i18n.translate('messages.serverError'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

   async createTokens(payload: JwtPayload, expiresIn: string = '24h') {
    return {
      accessToken: await this.jwtService.signAsync(payload, { expiresIn }),
    };
  }

  async validateGoogleUser(googleUser: GoogleUserDTO) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: googleUser.email },
      });
  
      if (user) {
        console.log('Usuario encontrado en DB:', user);
        return user;
      }
  
      // Si el usuario no existe, créalo
      const newUser = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name || '',
          lastName: googleUser.lastName || '',
          address: googleUser.address || '',
          phone: googleUser.phone || '',
          profileImg: googleUser.profileImg || '',
          password: await hashPassword('defaultPassword'),
          role: "USER",
          profile: {
            create: {
              bio: googleUser.bio || '',
            },
          },
        },
      });
  
      console.log('Usuario creado en DB:', newUser);
      return {...newUser,
        id: newUser.id,
        role: newUser.role,
      };
    } catch (error) {
      console.error('Error durante la validación del usuario de Google:', error);
      throw new Error('Error en la validación del usuario.');
    }
  }
  
}
