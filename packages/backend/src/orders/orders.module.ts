import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { DatabaseModule } from '../database/database.module';
import { PaymentsModule } from '../payments/payments.module';
import { ShippingModule } from '../shipping/shipping.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [
    DatabaseModule,
    PaymentsModule,
    ShippingModule,
    NotificationsModule,
    SearchModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}