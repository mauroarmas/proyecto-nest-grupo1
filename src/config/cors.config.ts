import { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";

export const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://front-e-commerce-vortex.vercel.app',
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // Permitir la petición
    } else {
      callback(new Error('Not allowed by CORS')); // Bloquear la petición
    }
  },
  credentials: true,
  allowedHeaders: [
    'x-requested-with',
    'authorization',
    'content-type',
  ],
  methods: 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
  preflightContinue: false,
  optionsSuccessStatus: 204,
};
