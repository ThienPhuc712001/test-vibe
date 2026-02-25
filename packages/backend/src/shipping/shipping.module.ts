import { Module } from '@nestjs/common';
import { ShippingController } from './shipping.controller';
import { ShippingService } from './shipping.service';
import { GHNService } from './providers/ghn.service';
import { GHTKService } from './providers/ghtk.service';
import { JNTService } from './providers/jnt.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ShippingController],
  providers: [
    ShippingService,
    GHNService,
    GHTKService,
    JNTService,
  ],
  exports: [
    ShippingService,
    GHNService,
    GHTKService,
    JNTService,
  ],
})
export class ShippingModule {}