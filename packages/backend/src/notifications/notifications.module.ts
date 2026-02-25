import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { FirebaseService } from './providers/firebase.service';
import { OneSignalService } from './providers/onesignal.service';
import { SocketService } from './providers/socket.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    FirebaseService,
    OneSignalService,
    SocketService,
  ],
  exports: [
    NotificationsService,
    FirebaseService,
    OneSignalService,
    SocketService,
  ],
})
export class NotificationsModule {}