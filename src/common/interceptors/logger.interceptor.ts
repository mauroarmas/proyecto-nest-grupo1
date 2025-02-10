import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
  } from '@nestjs/common';
  import { Request, Response } from 'express';
  import { catchError, tap } from 'rxjs';

  const chalk = require('chalk');
  
  @Injectable()
  export class LoggerInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler) {
      const ctx = context.switchToHttp();
      const request = ctx.getRequest<Request>();
      const response = ctx.getResponse<Response>();
      const date = new Date();
      const formatDate = date.toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
  
      return next.handle().pipe(
        tap((data) => {
          console.log(
            chalk.white.bgBlue.bold(
              'Request:',
              chalk.bgGreen.bold.black(
                request.url,
                request.method,
                response.statusCode.toString(),
                formatDate,
              ),
            ),
          );
          console.log(chalk.bgWhite.bold('Response:'));
          console.log(data);
        }),
        catchError((err) => {
          console.log(
            chalk.white.bgRed.bold(
              request.url,
              request.method,
              response.statusCode.toString(),
              formatDate,
            ),
          );
          console.log(chalk.white.bgRed.bold(err));
          throw err;
        }),
      );
    }
  }
  