import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import JwtModuleConfig from 'src/config/jwt.config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MessangingModule } from '../messanging/messanging.module';

@Module({
  imports: [JwtModuleConfig(), MessangingModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
