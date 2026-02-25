import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { StripeService } from './providers/stripe.service';
import { VNPayService } from './providers/vnpay.service';
import { MomoService } from './providers/momo.service';
import { WalletService } from './providers/wallet.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    StripeService,
    VNPayService,
    MomoService,
    WalletService,
  ],
  exports: [
    PaymentsService,
    StripeService,
    VNPayService,
    MomoService,
    WalletService,
  ],
})
export class PaymentsModule {}