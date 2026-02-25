import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { 
  CreateStreamDto, 
  UpdateStreamDto, 
  StreamStatus,
  StreamType,
  JoinStreamDto,
  LeaveStreamDto,
  StartStreamDto,
  EndStreamDto,
  PauseStreamDto,
  ResumeStreamDto,
  SendChatMessageDto,
  SendGiftDto,
  CreateProductShowcaseDto,
  UpdateStreamSettingsDto,
  StreamAnalyticsDto,
  StreamInvitationDto,
  BanUserDto,
  UnbanUserDto,
  MakeModeratorDto,
  RemoveModeratorDto,
  StreamWebhookDto
} from './dto/live-streaming.dto';
import { AgoraService } from './providers/agora.service';
import { LivekitService } from './providers/livekit.service';

@Injectable()
export class LiveStreamingService {
  private readonly logger = new Logger(LiveStreamingService.name);

  constructor(
    private prisma: PrismaService,
    private agoraService: AgoraService,
    private livekitService: LivekitService,
  ) {}

  /**
   * Create a new live stream
   */
  async createStream(userId: string, createStreamDto: CreateStreamDto) {
    try {
      // Check if user is a seller
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { seller: true },
      });

      if (!user || !user.seller) {
        throw new Error('Only sellers can create live streams');
      }

      // Create stream in database
      const stream = await this.prisma.liveStream.create({
        data: {
          title: createStreamDto.title,
          description: createStreamDto.description,
          type: createStreamDto.type,
          sellerId: userId,
          categoryId: createStreamDto.categoryId,
          productId: createStreamDto.productId,
          scheduledAt: createStreamDto.scheduledAt ? new Date(createStreamDto.scheduledAt) : null,
          duration: createStreamDto.duration,
          quality: createStreamDto.quality || 'standard',
          settings: createStreamDto.settings || {},
          tags: createStreamDto.tags || [],
          status: StreamStatus.SCHEDULED,
        },
        include: {
          seller: {
            include: {
              user: true,
              shop: true,
            },
          },
          category: true,
          product: true,
        },
      });

      // Create stream session with provider (default to Agora)
      const provider = createStreamDto.settings?.provider || 'agora';
      let streamSession;

      if (provider === 'agora') {
        streamSession = await this.agoraService.createStream({
          ...createStreamDto,
          id: stream.id,
          sellerId: userId,
        });
      } else if (provider === 'livekit') {
        streamSession = await this.livekitService.createStream({
          ...createStreamDto,
          id: stream.id,
          sellerId: userId,
        });
      }

      // Update stream with session data
      await this.prisma.liveStream.update({
        where: { id: stream.id },
        data: {
          streamKey: streamSession.channelName || streamSession.roomName,
          provider: provider,
        },
      });

      this.logger.log(`Created live stream: ${stream.id} by user: ${userId}`);
      return { stream, session: streamSession };
    } catch (error) {
      this.logger.error(`Failed to create stream: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get all live streams with filtering
   */
  async getStreams(filters: {
    status?: StreamStatus;
    type?: StreamType;
    categoryId?: string;
    sellerId?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      const { status, type, categoryId, sellerId, limit = 20, offset = 0 } = filters;

      const streams = await this.prisma.liveStream.findMany({
        where: {
          ...(status && { status }),
          ...(type && { type }),
          ...(categoryId && { categoryId }),
          ...(sellerId && { sellerId }),
        },
        include: {
          seller: {
            include: {
              user: true,
              shop: true,
            },
          },
          category: true,
          product: true,
          _count: {
            select: {
              viewers: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      });

      return streams;
    } catch (error) {
      this.logger.error(`Failed to get streams: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get live stream by ID
   */
  async getStreamById(streamId: string) {
    try {
      const stream = await this.prisma.liveStream.findUnique({
        where: { id: streamId },
        include: {
          seller: {
            include: {
              user: true,
              shop: true,
            },
          },
          category: true,
          product: true,
          viewers: {
            include: {
              user: true,
            },
          },
          products: {
            include: {
              product: true,
            },
          },
          _count: {
            select: {
              viewers: true,
              products: true,
            },
          },
        },
      });

      if (!stream) {
        throw new Error('Stream not found');
      }

      return stream;
    } catch (error) {
      this.logger.error(`Failed to get stream: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Update live stream
   */
  async updateStream(streamId: string, userId: string, updateStreamDto: UpdateStreamDto) {
    try {
      // Check if user owns the stream
      const stream = await this.prisma.liveStream.findUnique({
        where: { id: streamId },
      });

      if (!stream || stream.sellerId !== userId) {
        throw new Error('Stream not found or access denied');
      }

      const updatedStream = await this.prisma.liveStream.update({
        where: { id: streamId },
        data: {
          ...(updateStreamDto.title && { title: updateStreamDto.title }),
          ...(updateStreamDto.description && { description: updateStreamDto.description }),
          ...(updateStreamDto.status && { status: updateStreamDto.status }),
          ...(updateStreamDto.scheduledAt && { scheduledAt: new Date(updateStreamDto.scheduledAt) }),
          ...(updateStreamDto.duration && { duration: updateStreamDto.duration }),
          ...(updateStreamDto.quality && { quality: updateStreamDto.quality }),
          ...(updateStreamDto.settings && { settings: updateStreamDto.settings }),
        },
        include: {
          seller: {
            include: {
              user: true,
              shop: true,
            },
          },
          category: true,
          product: true,
        },
      });

      this.logger.log(`Updated stream: ${streamId} by user: ${userId}`);
      return updatedStream;
    } catch (error) {
      this.logger.error(`Failed to update stream: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Delete live stream
   */
  async deleteStream(streamId: string, userId: string) {
    try {
      // Check if user owns the stream
      const stream = await this.prisma.liveStream.findUnique({
        where: { id: streamId },
      });

      if (!stream || stream.sellerId !== userId) {
        throw new Error('Stream not found or access denied');
      }

      // Delete stream session from provider
      if (stream.provider === 'agora') {
        // await this.agoraService.deleteStream(stream.streamKey);
      } else if (stream.provider === 'livekit') {
        await this.livekitService.deleteRoom(stream.streamKey);
      }

      // Delete stream from database
      await this.prisma.liveStream.delete({
        where: { id: streamId },
      });

      this.logger.log(`Deleted stream: ${streamId} by user: ${userId}`);
      return { message: 'Stream deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete stream: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Start live stream
   */
  async startStream(streamId: string, userId: string, startStreamDto: StartStreamDto) {
    try {
      const stream = await this.prisma.liveStream.findUnique({
        where: { id: streamId },
      });

      if (!stream || stream.sellerId !== userId) {
        throw new Error('Stream not found or access denied');
      }

      if (stream.status !== StreamStatus.SCHEDULED && stream.status !== StreamStatus.PAUSED) {
        throw new Error('Stream cannot be started');
      }

      // Update stream status
      const updatedStream = await this.prisma.liveStream.update({
        where: { id: streamId },
        data: {
          status: StreamStatus.LIVE,
          startedAt: new Date(),
          quality: startStreamDto.quality || stream.quality,
          settings: {
            ...stream.settings,
            enableRecording: startStreamDto.enableRecording,
          },
        },
      });

      // Start recording if enabled
      if (startStreamDto.enableRecording && stream.streamKey) {
        if (stream.provider === 'agora') {
          await this.agoraService.startRecording(stream.streamKey);
        } else if (stream.provider === 'livekit') {
          await this.livekitService.startRecording(stream.streamKey);
        }
      }

      this.logger.log(`Started stream: ${streamId} by user: ${userId}`);
      return updatedStream;
    } catch (error) {
      this.logger.error(`Failed to start stream: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * End live stream
   */
  async endStream(streamId: string, userId: string, endStreamDto: EndStreamDto) {
    try {
      const stream = await this.prisma.liveStream.findUnique({
        where: { id: streamId },
      });

      if (!stream || stream.sellerId !== userId) {
        throw new Error('Stream not found or access denied');
      }

      if (stream.status !== StreamStatus.LIVE) {
        throw new Error('Stream is not live');
      }

      // Stop recording if enabled
      if (stream.settings?.enableRecording && stream.streamKey) {
        if (stream.provider === 'agora') {
          await this.agoraService.stopRecording(stream.streamKey);
        } else if (stream.provider === 'livekit') {
          await this.livekitService.stopRecording(stream.streamKey);
        }
      }

      // Update stream status
      const updatedStream = await this.prisma.liveStream.update({
        where: { id: streamId },
        data: {
          status: StreamStatus.ENDED,
          endedAt: new Date(),
          settings: {
            ...stream.settings,
            saveRecording: endStreamDto.saveRecording,
          },
        },
      });

      this.logger.log(`Ended stream: ${streamId} by user: ${userId}`);
      return updatedStream;
    } catch (error) {
      this.logger.error(`Failed to end stream: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Join live stream as viewer
   */
  async joinStream(userId: string, joinStreamDto: JoinStreamDto) {
    try {
      const stream = await this.prisma.liveStream.findUnique({
        where: { id: joinStreamDto.streamId },
      });

      if (!stream) {
        throw new Error('Stream not found');
      }

      if (stream.status !== StreamStatus.LIVE) {
        throw new Error('Stream is not live');
      }

      // Check if user is already a viewer
      const existingViewer = await this.prisma.streamViewer.findUnique({
        where: {
          userId_streamId: {
            userId,
            streamId: joinStreamDto.streamId,
          },
        },
      });

      if (existingViewer) {
        throw new Error('User already joined the stream');
      }

      // Get user info
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      // Join stream with provider
      let viewerData;
      if (stream.provider === 'agora') {
        viewerData = await this.agoraService.joinStream({
          ...joinStreamDto,
          channelName: stream.streamKey,
          userId,
          username: user?.username,
          avatar: user?.avatar,
        });
      } else if (stream.provider === 'livekit') {
        viewerData = await this.livekitService.joinStream({
          ...joinStreamDto,
          roomName: stream.streamKey,
          userId,
          username: user?.username,
          avatar: user?.avatar,
        });
      }

      // Add viewer to database
      const viewer = await this.prisma.streamViewer.create({
        data: {
          userId,
          streamId: joinStreamDto.streamId,
          role: joinStreamDto.role || 'participant',
          joinedAt: new Date(),
          token: viewerData.token,
        },
        include: {
          user: true,
        },
      });

      this.logger.log(`User ${userId} joined stream: ${joinStreamDto.streamId}`);
      return { viewer, session: viewerData };
    } catch (error) {
      this.logger.error(`Failed to join stream: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Leave live stream
   */
  async leaveStream(userId: string, leaveStreamDto: LeaveStreamDto) {
    try {
      const viewer = await this.prisma.streamViewer.findUnique({
        where: {
          userId_streamId: {
            userId,
            streamId: leaveStreamDto.streamId,
          },
        },
        include: {
          stream: true,
        },
      });

      if (!viewer) {
        throw new Error('Viewer not found');
      }

      // Remove viewer from provider
      if (viewer.stream.provider === 'agora') {
        await this.agoraService.kickUser(viewer.stream.streamKey, userId);
      } else if (viewer.stream.provider === 'livekit') {
        await this.livekitService.removeParticipant(viewer.stream.streamKey, userId);
      }

      // Remove viewer from database
      await this.prisma.streamViewer.delete({
        where: {
          userId_streamId: {
            userId,
            streamId: leaveStreamDto.streamId,
          },
        },
      });

      this.logger.log(`User ${userId} left stream: ${leaveStreamDto.streamId}`);
      return { message: 'Left stream successfully' };
    } catch (error) {
      this.logger.error(`Failed to leave stream: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Send chat message
   */
  async sendChatMessage(userId: string, sendChatMessageDto: SendChatMessageDto) {
    try {
      // Check if user is a viewer
      const viewer = await this.prisma.streamViewer.findUnique({
        where: {
          userId_streamId: {
            userId,
            streamId: sendChatMessageDto.streamId,
          },
        },
        include: {
          stream: true,
        },
      });

      if (!viewer) {
        throw new Error('User is not a viewer of this stream');
      }

      // Create chat message
      const message = await this.prisma.streamChat.create({
        data: {
          streamId: sendChatMessageDto.streamId,
          userId,
          message: sendChatMessageDto.message,
          parentId: sendChatMessageDto.parentId,
          type: sendChatMessageDto.type || 'text',
        },
        include: {
          user: true,
          parent: {
            include: {
              user: true,
            },
          },
        },
      });

      // Send message to provider
      const interactionData = {
        type: 'chat',
        userId,
        data: message,
        timestamp: new Date(),
      };

      if (viewer.stream.provider === 'agora') {
        await this.agoraService.sendMessage(viewer.stream.streamKey, interactionData);
      } else if (viewer.stream.provider === 'livekit') {
        await this.livekitService.sendMessage(viewer.stream.streamKey, interactionData);
      }

      this.logger.log(`User ${userId} sent message to stream: ${sendChatMessageDto.streamId}`);
      return message;
    } catch (error) {
      this.logger.error(`Failed to send chat message: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get stream analytics
   */
  async getStreamAnalytics(streamId: string, streamAnalyticsDto: StreamAnalyticsDto) {
    try {
      const stream = await this.prisma.liveStream.findUnique({
        where: { id: streamId },
      });

      if (!stream) {
        throw new Error('Stream not found');
      }

      // Get basic analytics from database
      const analytics = await this.prisma.streamAnalytics.findMany({
        where: {
          streamId,
          ...(streamAnalyticsDto.startDate && {
            timestamp: {
              gte: new Date(streamAnalyticsDto.startDate),
            },
          }),
          ...(streamAnalyticsDto.endDate && {
            timestamp: {
              lte: new Date(streamAnalyticsDto.endDate),
            },
          }),
        },
        orderBy: {
          timestamp: 'desc',
        },
      });

      // Get provider-specific stats
      let providerStats;
      if (stream.provider === 'agora') {
        providerStats = await this.agoraService.getStreamStats(stream.streamKey);
      } else if (stream.provider === 'livekit') {
        providerStats = await this.livekitService.getStreamStats(stream.streamKey);
      }

      return {
        streamId,
        analytics,
        providerStats,
      };
    } catch (error) {
      this.logger.error(`Failed to get stream analytics: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get popular streams
   */
  async getPopularStreams(limit: number = 10) {
    try {
      const streams = await this.prisma.liveStream.findMany({
        where: {
          status: StreamStatus.LIVE,
        },
        include: {
          seller: {
            include: {
              user: true,
              shop: true,
            },
          },
          category: true,
          product: true,
          _count: {
            select: {
              viewers: true,
            },
          },
        },
        orderBy: {
          viewers: {
            _count: 'desc',
          },
        },
        take: limit,
      });

      return streams;
    } catch (error) {
      this.logger.error(`Failed to get popular streams: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get user's streams
   */
  async getUserStreams(userId: string, filters: {
    status?: StreamStatus;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      const { status, limit = 20, offset = 0 } = filters;

      const streams = await this.prisma.liveStream.findMany({
        where: {
          sellerId: userId,
          ...(status && { status }),
        },
        include: {
          category: true,
          product: true,
          _count: {
            select: {
              viewers: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      });

      return streams;
    } catch (error) {
      this.logger.error(`Failed to get user streams: ${(error as Error).message}`);
      throw error;
    }
  }
}