import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import JwtModuleConfig from 'src/config/jwt.config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MessangingModule } from '../messaging/messaging.module';
import  oauthConfig  from 'src/config/google-oauth.config';
import { ConfigModule } from '@nestjs/config';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [oauthConfig],
      isGlobal: true,
    }),
    JwtModuleConfig(),
     MessangingModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy],
})
export class AuthModule {}
