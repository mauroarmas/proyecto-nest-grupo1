import { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";

export const corsOptions: CorsOptions = {
    origin: ['http://localhost:3000', '*'], // Dominios permitidos
    credentials: true, // Permite el uso de cookies o credenciales
    allowedHeaders: [
      'x-requested-with',
      'authorization',
      'content-type',
    ],
    methods: 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
    preflightContinue: false, // No necesitas devolver la solicitud preflight
  };
  