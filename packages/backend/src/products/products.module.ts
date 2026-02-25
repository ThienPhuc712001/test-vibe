import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';

import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { CategoriesModule } from '../categories/categories.module';
import { BrandsModule } from '../brands/brands.module';
import { ShopsModule } from '../shops/shops.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
    DatabaseModule,
    CategoriesModule,
    BrandsModule,
    ShopsModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}