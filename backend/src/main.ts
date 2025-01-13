import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const corsOrigin = process.env.NODE_ENV !== 'production'
    ? ['http://localhost:4200', /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/, /^http:\/\/172\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/, /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/]
    : 'http://23.23.150.233';

  app.enableCors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    exposedHeaders: ['Access-Control-Allow-Origin']
  });

  // Add global prefix if you're using one
  // app.setGlobalPrefix('api');

  await app.listen(3000);
}
bootstrap();

