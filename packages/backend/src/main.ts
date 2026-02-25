import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ResponseInterceptor(),
  );

  // CORS configuration
  app.enableCors({
    origin: [
      configService.get('FRONTEND_URL', 'http://localhost:3000'),
      configService.get('ADMIN_URL', 'http://localhost:3001'),
    ],
    credentials: true,
  });

  // API prefix
  const apiPrefix = configService.get('API_PREFIX', 'api');
  app.setGlobalPrefix(apiPrefix);

  // Swagger documentation
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Marketplace API')
      .setDescription('Multi-vendor marketplace platform API documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth')
      .addTag('users')
      .addTag('sellers')
      .addTag('shops')
      .addTag('products')
      .addTag('categories')
      .addTag('brands')
      .addTag('cart')
      .addTag('orders')
      .addTag('payments')
      .addTag('shipping')
      .addTag('vouchers')
      .addTag('flash-sales')
      .addTag('live-streaming')
      .addTag('reviews')
      .addTag('notifications')
      .addTag('chat')
      .addTag('wishlist')
      .addTag('admin')
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  const port = configService.get('PORT', 3002);
  await app.listen(port);
  
  console.log(`🚀 Application is running on: http://localhost:${port}/${apiPrefix}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api`);
}

bootstrap();