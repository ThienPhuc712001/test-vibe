import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SellersModule } from './sellers/sellers.module';
import { ShopsModule } from './shops/shops.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { BrandsModule } from './brands/brands.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { ShippingModule } from './shipping/shipping.module';
import { VouchersModule } from './vouchers/vouchers.module';
import { FlashSalesModule } from './flash-sales/flash-sales.module';
import { LiveStreamingModule } from './live-streaming/live-streaming.module';
import { SearchModule } from './search/search.module';
import { ReviewsModule } from './reviews/reviews.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ChatModule } from './chat/chat.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { AdminModule } from './admin/admin.module';
import { CommonModule } from './common/common.module';
import { WebSocketModule } from './websocket/websocket.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Static files
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),

    // Database
    DatabaseModule,

    // Core modules
    AuthModule,
    UsersModule,
    SellersModule,
    ShopsModule,
    ProductsModule,
    CategoriesModule,
    BrandsModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    ShippingModule,
    VouchersModule,
    FlashSalesModule,
    LiveStreamingModule,
    SearchModule,
    ReviewsModule,
    NotificationsModule,
    ChatModule,
    WishlistModule,
    AdminModule,
    CommonModule,
    WebSocketModule,
    AnalyticsModule,
  ],
})
export class AppModule {}