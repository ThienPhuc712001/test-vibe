import { Module } from '@nestjs/common';
import { LiveStreamingController } from './live-streaming.controller';
import { LiveStreamingService } from './live-streaming.service';
import { AgoraService } from './providers/agora.service';
import { LivekitService } from './providers/livekit.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [LiveStreamingController],
  providers: [
    LiveStreamingService,
    AgoraService,
    LivekitService,
  ],
  exports: [
    LiveStreamingService,
    AgoraService,
    LivekitService,
  ],
})
export class LiveStreamingModule {}