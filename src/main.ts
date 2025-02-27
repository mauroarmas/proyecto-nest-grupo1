import { NestApplication, NestFactory, Reflector } from '@nestjs/core';
import { corsOptions } from './config/cors.config';
import { ConfigService } from '@nestjs/config';
import { ClassSerializerInterceptor, Logger } from '@nestjs/common';
import { AppModule } from './modules/app/app.module';
import { ValidationsExceptionFilter } from './common/middlewares';
import { LoggerInterceptor } from './common/interceptors/logger.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { I18nValidationPipe } from 'nestjs-i18n';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors(corsOptions);
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new I18nValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
  
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector), {
      excludePrefixes: ['password', 'updatedAt', 'isDeleted'],
      ignoreDecorators: true,
    }),
  );
  app.useGlobalFilters(new ValidationsExceptionFilter());

  app.useGlobalInterceptors(new LoggerInterceptor())

  const configService = app.get(ConfigService);

  const PORT = configService.get<number>('PORT');
  const NODE_ENV = configService.get<string>('NODE_ENV');

  // Revisar
  const config = new DocumentBuilder()
    .setTitle('API NestJs')
    .setDescription('Proyecto final NestJs')
    .setVersion('1.0')
    .addTag('Proyecto 1')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(PORT, () => {
    Logger.log(
      `Application running the port: http://localhost:${PORT}`,
      NestApplication.name,
    );
    Logger.log(`Current Environment: ${NODE_ENV}`, NestApplication.name);
  });

}
bootstrap();
