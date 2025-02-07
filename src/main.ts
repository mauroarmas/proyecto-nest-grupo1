import { NestApplication, NestFactory, Reflector } from '@nestjs/core';
import { corsOptions } from './config/cors.config';
import { ConfigService } from '@nestjs/config';
import { ClassSerializerInterceptor, Logger } from '@nestjs/common';
import { AppModule } from './modules/app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors(corsOptions);
  app.setGlobalPrefix('api/v1');

  app.useGlobalInterceptors(new ClassSerializerInterceptor(
    app.get(Reflector), //intercepta las peticiones
    {excludePrefixes: ['password', 'createdAt', 'updatedAt', 'isDeleted']} //objeto con las opciones (esta excluye la propiedad password)
  )); //intercepta las respuestas

  const configService = app.get(ConfigService);

  const PORT = configService.get<number>('PORT');
  const NODE_ENV = configService.get<string>('NODE_ENV');

  await app.listen(PORT, () => {
    Logger.log(
      `Application running the port: http://localhost:${PORT}`, //Application running the port
      NestApplication.name,
    );
    Logger.log(`Current Environment: ${NODE_ENV}`, NestApplication.name); //Current environment
  }); 

}
bootstrap();
