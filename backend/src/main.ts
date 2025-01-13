import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { NetworkInterfaceInfo, networkInterfaces } from 'os';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const isDevelopment = configService.get('NODE_ENV') !== 'production';
  
  // Get the server's IP address for development
  const nets = networkInterfaces();
  const localIP = Object.values(nets)
    .flat()
    .find((iface: NetworkInterfaceInfo) => 
      iface && iface.family === 'IPv4' && !iface.internal
    )?.address || 'localhost';
  
  // Enable CORS with environment-specific settings
  app.enableCors({
    origin: isDevelopment 
      ? [
          'http://localhost:4200',
          `http://${localIP}:4200`,
          /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/,
          /^http:\/\/172\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/,
          /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/
        ]
      : ['http://23.23.150.233', 'http://23.23.150.233:4200'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  });
  
  const port = 3000;
  const host = isDevelopment ? '0.0.0.0' : 'localhost';
  
  await app.listen(port, host);
  if (isDevelopment) {
    console.log(`Server running in development mode`);
    console.log(`Local access: http://localhost:${port}`);
    console.log(`Network access: http://${localIP}:${port}`);
  }
}
bootstrap();

