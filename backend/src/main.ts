import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Explicitly set production mode based on environment
  const isProd = process.env.NODE_ENV === 'production';
  console.log('Environment:', process.env.NODE_ENV);
  
  app.enableCors({
    origin: isProd ? 'http://23.23.150.233' : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  });

  await app.listen(3000, () => {
    console.log(`Application is running with CORS origin: ${isProd ? 'http://23.23.150.233' : 'all'}`);
  });
}
bootstrap();

