import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    // Only use in development/testing
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    // Tab order matters due to foreign key constraints
    const tablenames = [
      'wallet_transactions',
      'commissions',
      'ticket_messages',
      'tickets',
      'notifications',
      'chat_messages',
      'live_stream_views',
      'live_stream_items',
      'live_streams',
      'flash_sale_items',
      'flash_sales',
      'voucher_usages',
      'vouchers',
      'tracking_events',
      'shipments',
      'payments',
      'order_items',
      'orders',
      'wishlist_items',
      'wishlists',
      'reviews',
      'cart_items',
      'carts',
      'product_variants',
      'product_analytics',
      'products',
      'shop_followers',
      'shop_analytics',
      'shops',
      'brands',
      'categories',
      'addresses',
      'wallets',
      'customers',
      'sellers',
      'users',
      'system_configs',
      'carriers',
    ];

    for (const tablename of tablenames) {
      try {
        await this.$executeRawUnsafe(`DELETE FROM "${tablename}";`);
      } catch (error) {
        console.log({ error });
      }
    }
  }
}