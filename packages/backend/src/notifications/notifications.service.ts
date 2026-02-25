import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { FirebaseService } from './providers/firebase.service';
import { OneSignalService } from './providers/onesignal.service';
import { SocketService } from './providers/socket.service';
import { 
  CreateNotificationDto, 
  UpdateNotificationDto, 
  SendNotificationDto,
  BulkNotificationDto,
  MarkAsReadDto,
  NotificationQueryDto,
  NotificationSettingsDto,
  UpdateNotificationSettingsDto,
  PushTokenDto,
  RemovePushTokenDto,
  EmailNotificationDto,
  SMSNotificationDto,
  NotificationAnalyticsDto,
  NotificationStatsDto,
  CampaignDto,
  SendCampaignDto,
  NotificationType,
  NotificationChannel,
  NotificationPriority
} from './dto/notifications.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private firebaseService: FirebaseService,
    private oneSignalService: OneSignalService,
    private socketService: SocketService,
  ) {}

  /**
   * Create a new notification
   */
  async createNotification(createNotificationDto: CreateNotificationDto) {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId: createNotificationDto.userId,
          type: createNotificationDto.type,
          title: createNotificationDto.title,
          message: createNotificationDto.message,
          data: createNotificationDto.data || {},
          priority: createNotificationDto.priority || NotificationPriority.NORMAL,
          channels: createNotificationDto.channels || [NotificationChannel.IN_APP],
          imageUrl: createNotificationDto.imageUrl,
          actionUrl: createNotificationDto.actionUrl,
          isRead: createNotificationDto.isRead || false,
          scheduledAt: createNotificationDto.scheduledAt ? new Date(createNotificationDto.scheduledAt) : null,
        },
      });

      // Send notification immediately if not scheduled
      if (!createNotificationDto.scheduledAt) {
        await this.sendNotification(notification.id);
      }

      this.logger.log(`Created notification: ${notification.id} for user: ${createNotificationDto.userId}`);
      return notification;
    } catch (error) {
      this.logger.error(`Failed to create notification: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(query: NotificationQueryDto) {
    try {
      const {
        userId,
        type,
        priority,
        isRead,
        startDate,
        endDate,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = query;

      const whereClause: any = {};

      if (userId) whereClause.userId = userId;
      if (type) whereClause.type = type;
      if (priority) whereClause.priority = priority;
      if (isRead !== undefined) whereClause.isRead = isRead;
      if (startDate) whereClause.createdAt = { gte: new Date(startDate) };
      if (endDate) whereClause.createdAt = { ...whereClause.createdAt, lte: new Date(endDate) };

      const notifications = await this.prisma.notification.findMany({
        where: whereClause,
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: (page - 1) * limit,
      });

      const total = await this.prisma.notification.count({ where: whereClause });

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get notifications: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(id: string) {
    try {
      const notification = await this.prisma.notification.findUnique({
        where: { id },
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      return notification;
    } catch (error) {
      this.logger.error(`Failed to get notification: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Update notification
   */
  async updateNotification(id: string, updateNotificationDto: UpdateNotificationDto) {
    try {
      const notification = await this.prisma.notification.update({
        where: { id },
        data: {
          ...(updateNotificationDto.title && { title: updateNotificationDto.title }),
          ...(updateNotificationDto.message && { message: updateNotificationDto.message }),
          ...(updateNotificationDto.data && { data: updateNotificationDto.data }),
          ...(updateNotificationDto.priority && { priority: updateNotificationDto.priority }),
          ...(updateNotificationDto.channels && { channels: updateNotificationDto.channels }),
          ...(updateNotificationDto.imageUrl && { imageUrl: updateNotificationDto.imageUrl }),
          ...(updateNotificationDto.actionUrl && { actionUrl: updateNotificationDto.actionUrl }),
          ...(updateNotificationDto.isRead !== undefined && { isRead: updateNotificationDto.isRead }),
        },
      });

      this.logger.log(`Updated notification: ${id}`);
      return notification;
    } catch (error) {
      this.logger.error(`Failed to update notification: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(id: string) {
    try {
      await this.prisma.notification.delete({
        where: { id },
      });

      this.logger.log(`Deleted notification: ${id}`);
      return { message: 'Notification deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete notification: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(markAsReadDto: MarkAsReadDto) {
    try {
      await this.prisma.notification.updateMany({
        where: {
          id: { in: markAsReadDto.notificationIds },
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      this.logger.log(`Marked ${markAsReadDto.notificationIds.length} notifications as read`);
      return { message: 'Notifications marked as read successfully' };
    } catch (error) {
      this.logger.error(`Failed to mark notifications as read: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Send notification to users
   */
  async sendNotification(sendNotificationDto: SendNotificationDto) {
    try {
      const { userId, userIds, type, title, message, data, priority, channels, imageUrl, actionUrl, scheduledAt } = sendNotificationDto;

      const targetUsers = userId ? [userId] : userIds || [];
      const notificationChannels = channels || [NotificationChannel.IN_APP];

      // Create notifications in database
      const notifications = await Promise.all(
        targetUsers.map(targetUserId =>
          this.prisma.notification.create({
            data: {
              userId: targetUserId,
              type,
              title,
              message,
              data: data || {},
              priority: priority || NotificationPriority.NORMAL,
              channels: notificationChannels,
              imageUrl,
              actionUrl,
              isRead: false,
              scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
            },
          })
        )
      );

      // Send notifications through different channels
      for (const notification of notifications) {
        await this.sendNotificationThroughChannels(notification, notificationChannels);
      }

      this.logger.log(`Sent notification to ${targetUsers.length} users`);
      return notifications;
    } catch (error) {
      this.logger.error(`Failed to send notification: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(bulkNotificationDto: BulkNotificationDto) {
    try {
      const notifications = await Promise.all(
        bulkNotificationDto.notifications.map(notificationDto =>
          this.createNotification(notificationDto)
        )
      );

      this.logger.log(`Sent ${bulkNotificationDto.notifications.length} bulk notifications`);
      return notifications;
    } catch (error) {
      this.logger.error(`Failed to send bulk notifications: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Send notification through different channels
   */
  private async sendNotificationThroughChannels(notification: any, channels: NotificationChannel[]) {
    const promises: Promise<any>[] = [];

    for (const channel of channels) {
      switch (channel) {
        case NotificationChannel.PUSH:
          promises.push(this.sendPushNotification(notification));
          break;
        case NotificationChannel.EMAIL:
          promises.push(this.sendEmailNotification(notification));
          break;
        case NotificationChannel.SMS:
          promises.push(this.sendSMSNotification(notification));
          break;
        case NotificationChannel.IN_APP:
          promises.push(this.sendInAppNotification(notification));
          break;
        case NotificationChannel.WEBSOCKET:
          promises.push(this.sendWebSocketNotification(notification));
          break;
      }
    }

    await Promise.allSettled(promises);
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(notification: any) {
    try {
      // Get user's push tokens
      const pushTokens = await this.getUserPushTokens(notification.userId);

      if (pushTokens.length === 0) {
        this.logger.warn(`No push tokens found for user: ${notification.userId}`);
        return;
      }

      const tokens = pushTokens.map(token => token.token);

      // Send via Firebase
      if (tokens.length > 0) {
        await this.firebaseService.sendMulticastPushNotification(
          tokens,
          notification.title,
          notification.message,
          notification.data,
          notification.imageUrl,
          notification.actionUrl
        );
      }

      // Send via OneSignal
      await this.oneSignalService.sendNotification(
        tokens,
        notification.title,
        notification.message,
        notification.data,
        {
          imageUrl: notification.imageUrl,
          actionUrl: notification.actionUrl,
          priority: notification.priority,
        }
      );

      this.logger.log(`Push notification sent for notification: ${notification.id}`);
    } catch (error) {
      this.logger.error(`Failed to send push notification: ${(error as Error).message}`);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(notification: any) {
    try {
      // Get user's email
      const user = await this.prisma.user.findUnique({
        where: { id: notification.userId },
        select: { email: true },
      });

      if (!user?.email) {
        this.logger.warn(`No email found for user: ${notification.userId}`);
        return;
      }

      const emailData: EmailNotificationDto = {
        to: user.email,
        subject: notification.title,
        htmlContent: this.generateEmailTemplate(notification),
        textContent: notification.message,
      };

      await this.firebaseService.sendEmail(emailData);

      this.logger.log(`Email notification sent for notification: ${notification.id}`);
    } catch (error) {
      this.logger.error(`Failed to send email notification: ${(error as Error).message}`);
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(notification: any) {
    try {
      // Get user's phone number
      const user = await this.prisma.user.findUnique({
        where: { id: notification.userId },
        select: { phone: true },
      });

      if (!user?.phone) {
        this.logger.warn(`No phone number found for user: ${notification.userId}`);
        return;
      }

      const smsData: SMSNotificationDto = {
        to: user.phone,
        message: notification.message,
      };

      // This would integrate with an SMS service like Twilio
      // For now, just logging
      this.logger.log(`SMS notification would be sent for notification: ${notification.id}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS notification: ${(error as Error).message}`);
    }
  }

  /**
   * Send in-app notification
   */
  private async sendInAppNotification(notification: any) {
    try {
      // In-app notifications are stored in the database and retrieved by the client
      // No additional action needed here
      this.logger.log(`In-app notification stored for notification: ${notification.id}`);
    } catch (error) {
      this.logger.error(`Failed to store in-app notification: ${(error as Error).message}`);
    }
  }

  /**
   * Send WebSocket notification
   */
  private async sendWebSocketNotification(notification: any) {
    try {
      await this.socketService.sendNotificationToUser(
        notification.userId,
        notification.type,
        notification.title,
        notification.message,
        notification.data,
        notification.priority
      );

      this.logger.log(`WebSocket notification sent for notification: ${notification.id}`);
    } catch (error) {
      this.logger.error(`Failed to send WebSocket notification: ${(error as Error).message}`);
    }
  }

  /**
   * Get user's push tokens
   */
  private async getUserPushTokens(userId: string) {
    try {
      return await this.prisma.pushToken.findMany({
        where: { userId },
      });
    } catch (error) {
      this.logger.error(`Failed to get user push tokens: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Generate email template
   */
  private generateEmailTemplate(notification: any): string {
    const templates = {
      [NotificationType.ORDER_STATUS]: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Order Status Update</h2>
          <p style="color: #666;">${notification.message}</p>
          ${notification.actionUrl ? `<a href="${notification.actionUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Order</a>` : ''}
        </div>
      `,
      [NotificationType.PAYMENT_STATUS]: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Payment Status Update</h2>
          <p style="color: #666;">${notification.message}</p>
          ${notification.actionUrl ? `<a href="${notification.actionUrl}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Payment</a>` : ''}
        </div>
      `,
      [NotificationType.PROMOTION]: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Special Offer!</h2>
          <p style="color: #666;">${notification.message}</p>
          ${notification.imageUrl ? `<img src="${notification.imageUrl}" style="max-width: 100%; height: auto; margin: 20px 0;">` : ''}
          ${notification.actionUrl ? `<a href="${notification.actionUrl}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Shop Now</a>` : ''}
        </div>
      `,
    };

    return templates[notification.type] || `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${notification.title}</h2>
        <p style="color: #666;">${notification.message}</p>
        ${notification.actionUrl ? `<a href="${notification.actionUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Details</a>` : ''}
      </div>
    `;
  }

  /**
   * Get user notification settings
   */
  async getNotificationSettings(userId: string) {
    try {
      const settings = await this.prisma.notificationSettings.findUnique({
        where: { userId },
      });

      if (!settings) {
        // Create default settings
        const defaultSettings = this.getDefaultNotificationSettings();
        await this.prisma.notificationSettings.create({
          data: {
            userId,
            settings: defaultSettings,
          },
        });
        return defaultSettings;
      }

      return settings.settings;
    } catch (error) {
      this.logger.error(`Failed to get notification settings: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(userId: string, updateNotificationSettingsDto: UpdateNotificationSettingsDto) {
    try {
      const settings = await this.prisma.notificationSettings.upsert({
        where: { userId },
        update: {
          settings: updateNotificationSettingsDto.settings,
        },
        create: {
          userId,
          settings: updateNotificationSettingsDto.settings,
        },
      });

      this.logger.log(`Updated notification settings for user: ${userId}`);
      return settings;
    } catch (error) {
      this.logger.error(`Failed to update notification settings: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get default notification settings
   */
  private getDefaultNotificationSettings(): Record<NotificationType, { enabled: boolean; channels: NotificationChannel[] }> {
    const settings: Record<NotificationType, { enabled: boolean; channels: NotificationChannel[] }> = {} as any;

    Object.values(NotificationType).forEach(type => {
      settings[type] = {
        enabled: true,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
      };
    });

    return settings;
  }

  /**
   * Register push token
   */
  async registerPushToken(pushTokenDto: PushTokenDto) {
    try {
      // Remove existing token for this device if exists
      await this.prisma.pushToken.deleteMany({
        where: {
          token: pushTokenDto.token,
        },
      });

      // Register new token
      const token = await this.prisma.pushToken.create({
        data: {
          userId: pushTokenDto.userId,
          token: pushTokenDto.token,
          platform: pushTokenDto.platform,
          deviceId: pushTokenDto.deviceId,
          appVersion: pushTokenDto.appVersion,
          isActive: true,
        },
      });

      // Register with Firebase
      await this.firebaseService.registerPushToken(pushTokenDto);

      // Register with OneSignal
      await this.oneSignalService.registerPushToken(pushTokenDto);

      this.logger.log(`Registered push token for user: ${pushTokenDto.userId}`);
      return token;
    } catch (error) {
      this.logger.error(`Failed to register push token: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Remove push token
   */
  async removePushToken(removePushTokenDto: RemovePushTokenDto) {
    try {
      await this.prisma.pushToken.deleteMany({
        where: {
          userId: removePushTokenDto.userId,
          token: removePushTokenDto.token,
        },
      });

      // Remove from Firebase
      await this.firebaseService.removePushToken(removePushTokenDto.userId, removePushTokenDto.token);

      this.logger.log(`Removed push token for user: ${removePushTokenDto.userId}`);
      return { message: 'Push token removed successfully' };
    } catch (error) {
      this.logger.error(`Failed to remove push token: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(notificationStatsDto: NotificationStatsDto) {
    try {
      const { userId, startDate, endDate, type, channel } = notificationStatsDto;

      const whereClause: any = {};

      if (userId) whereClause.userId = userId;
      if (startDate) whereClause.createdAt = { gte: new Date(startDate) };
      if (endDate) whereClause.createdAt = { ...whereClause.createdAt, lte: new Date(endDate) };
      if (type) whereClause.type = type;

      const stats = await this.prisma.notification.groupBy({
        by: ['type', 'priority'],
        where: whereClause,
        _count: {
          id: true,
        },
      });

      return {
        total: stats.reduce((sum, stat) => sum + stat._count.id, 0),
        byType: stats,
        period: { startDate, endDate },
      };
    } catch (error) {
      this.logger.error(`Failed to get notification stats: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Process scheduled notifications
   */
  async processScheduledNotifications() {
    try {
      const now = new Date();
      const scheduledNotifications = await this.prisma.notification.findMany({
        where: {
          scheduledAt: {
            lte: now,
          },
          sentAt: null,
        },
      });

      for (const notification of scheduledNotifications) {
        await this.sendNotification(notification.id);
        
        // Update sent timestamp
        await this.prisma.notification.update({
          where: { id: notification.id },
          data: { sentAt: now },
        });
      }

      this.logger.log(`Processed ${scheduledNotifications.length} scheduled notifications`);
    } catch (error) {
      this.logger.error(`Failed to process scheduled notifications: ${(error as Error).message}`);
    }
  }

  /**
   * Clean up old notifications
   */
  async cleanupOldNotifications() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await this.prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo,
          },
          isRead: true,
        },
      });

      this.logger.log(`Cleaned up ${result.count} old notifications`);
    } catch (error) {
      this.logger.error(`Failed to cleanup old notifications: ${(error as Error).message}`);
    }
  }
}