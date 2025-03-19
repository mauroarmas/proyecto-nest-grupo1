import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    console.log(profile);
    const user = await this.authService.validateGoogleUser({
        email: profile.emails[0].value,
        name: profile.name.givenName,
        lastName: profile.name.familyName,
        profileImg: profile.photos[0].value,
        password:""
    });
    done(null, user);
  }
}

// const { name, emails, photos } = profile;
// const user = {
//     email: emails[0].value,
//     firstName: name.givenName,
//     lastName: name.familyName,
//     picture: photos[0].value,
//     accessToken
// }
// done(null, user);
