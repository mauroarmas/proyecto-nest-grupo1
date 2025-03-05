import { ArgumentsHost, Catch, ExceptionFilter, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { MulterError } from 'multer';

@Catch(MulterError)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost) {
    console.log('🔥 MulterExceptionFilter activado:', exception.code);

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let message = 'Error al subir archivos';

    switch (exception.code) {
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Se ha excedido el número máximo de archivos permitidos (5).';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Solo se permiten subir hasta 5 imágenes por producto.';
        break;
      case 'LIMIT_FILE_SIZE':
        message = 'Uno de los archivos excede el tamaño máximo permitido (5 MB).';
        break;
    }

    response.status(400).json({
      statusCode: 400,
      error: 'Bad Request',
      message,
    });
  }
}
