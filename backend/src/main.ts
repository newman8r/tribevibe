import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const corsOrigin = process.env.NODE_ENV !== 'production'
    ? ['http://localhost:4200', /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/, /^http:\/\/172\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/, /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/]
    : 'http://23.23.150.233';

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (process.env.NODE_ENV === 'production') {
        if (origin === corsOrigin) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      } else {
        // Development environment - check against array of allowed origins
        const isAllowed = [
          'http://localhost:4200',
          /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/,
          /^http:\/\/172\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/,
          /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/
        ].some(allowedOrigin => {
          if (allowedOrigin instanceof RegExp) {
            return allowedOrigin.test(origin);
          }
          return allowedOrigin === origin;
        });
        
        callback(null, isAllowed);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Access-Control-Allow-Origin'],
    maxAge: 3600
  });

  await app.listen(3000);
}
bootstrap();

