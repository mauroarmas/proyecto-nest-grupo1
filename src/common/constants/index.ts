import { ConfigService } from '@nestjs/config';

const env = process.env;

export enum RoleEnum {
  SUPERADMIN = 'SUPERADMIN',
  USER = 'USER',
}


export const getMessagingConfig = (configService: ConfigService) => ({
  emailSender: configService.get('EMAIL_SENDER'),
  apiKey: configService.get('MAILJET_API_KEY'),
  secret: configService.get('MAILJET_SECRET_KEY'),
  resetPasswordUrls: {
    backoffice: configService.get('BACKOFFICE_RESET_PASSWORD_URL'),
  },
});

export const awsConfig = {
  client: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: env.AWS_REGION
  },
  s3:{
    bucket: env.AWS_BUCKET,
  },
  timeout: {
    connection: parseInt(env.AWS_CONNECTION_TIMEOUT),
    socket: parseInt(env.AWS_SOCKET_TIMEOUT)
  }
} as const

