import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { 
  NotificationType, 
  NotificationPriority,
  PushTokenDto,
  EmailNotificationDto,
  NotificationAnalyticsDto 
} from '../dto/notifications.dto';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private fcm: admin.messaging.Messaging;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      const serviceAccount = {
        projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
        clientEmail: this.configService.get<string>('FIREBASE_CLIENT_EMAIL'),
        privateKey: this.configService.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.projectId,
      });

      this.fcm = admin.messaging();
      this.logger.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize Firebase: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Send push notification to a single device
   */
  async sendPushNotification(
    token: string,
    title: string,
    message: string,
    data?: Record<string, any>,
    imageUrl?: string,
    actionUrl?: string,
  ) {
    try {
      const notification: admin.messaging.Notification = {
        title,
        body: message,
        imageUrl,
      };

      const androidNotification: admin.messaging.AndroidConfig = {
        notification: {
          title,
          body: message,
          imageUrl,
          clickAction: actionUrl,
        },
        data,
        priority: this.getPriority('high'),
      };

      const apnsNotification: admin.messaging.ApnsConfig = {
        payload: {
          aps: {
            alert: {
              title,
              body: message,
            },
            badge: 1,
            sound: 'default',
            mutableContent: true,
          },
        },
        data,
      };

      const message: admin.messaging.Message = {
        token,
        notification,
        android: androidNotification,
        apns: apnsNotification,
        data,
        webpush: {
          notification: {
            title,
            body: message,
            icon: imageUrl,
            data,
            actions: actionUrl ? [{ action: 'open', title: 'Open', url: actionUrl }] : [],
          },
        },
      };

      const result = await this.fcm.send(message);
      this.logger.log(`Push notification sent successfully to token: ${token.substring(0, 10)}...`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to send push notification: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Send push notification to multiple devices
   */
  async sendMulticastPushNotification(
    tokens: string[],
    title: string,
    message: string,
    data?: Record<string, any>,
    imageUrl?: string,
    actionUrl?: string,
  ) {
    try {
      const notification: admin.messaging.Notification = {
        title,
        body: message,
        imageUrl,
      };

      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification,
        android: {
          notification: {
            title,
            body: message,
            imageUrl,
            clickAction: actionUrl,
          },
          data,
          priority: this.getPriority('high'),
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title,
                body: message,
              },
              badge: 1,
              sound: 'default',
              mutableContent: true,
            },
          },
          data,
        },
        webpush: {
          notification: {
            title,
            body: message,
            icon: imageUrl,
            data,
            actions: actionUrl ? [{ action: 'open', title: 'Open', url: actionUrl }] : [],
          },
        },
        data,
      };

      const result = await this.fcm.sendMulticast(message);
      this.logger.log(`Multicast push notification sent to ${tokens.length} devices`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to send multicast push notification: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Send push notification to a topic
   */
  async sendTopicNotification(
    topic: string,
    title: string,
    message: string,
    data?: Record<string, any>,
    imageUrl?: string,
    actionUrl?: string,
  ) {
    try {
      const notification: admin.messaging.Notification = {
        title,
        body: message,
        imageUrl,
      };

      const message: admin.messaging.Message = {
        topic,
        notification,
        android: {
          notification: {
            title,
            body: message,
            imageUrl,
            clickAction: actionUrl,
          },
          data,
          priority: this.getPriority('high'),
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title,
                body: message,
              },
              badge: 1,
              sound: 'default',
              mutableContent: true,
            },
          },
          data,
        },
        webpush: {
          notification: {
            title,
            body: message,
            icon: imageUrl,
            data,
            actions: actionUrl ? [{ action: 'open', title: 'Open', url: actionUrl }] : [],
          },
        },
        data,
      };

      const result = await this.fcm.send(message);
      this.logger.log(`Topic notification sent to topic: ${topic}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to send topic notification: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Subscribe devices to a topic
   */
  async subscribeToTopic(tokens: string[], topic: string) {
    try {
      const response = await this.fcm.subscribeToTopic(tokens, topic);
      this.logger.log(`Subscribed ${tokens.length} devices to topic: ${topic}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to subscribe to topic: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Unsubscribe devices from a topic
   */
  async unsubscribeFromTopic(tokens: string[], topic: string) {
    try {
      const response = await this.fcm.unsubscribeFromTopic(tokens, topic);
      this.logger.log(`Unsubscribed ${tokens.length} devices from topic: ${topic}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to unsubscribe from topic: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Send email using Firebase
   */
  async sendEmail(emailData: EmailNotificationDto) {
    try {
      const transport = admin.createTransport({
        service: 'gmail',
        auth: {
          user: this.configService.get<string>('FIREBASE_EMAIL_USER'),
          pass: this.configService.get<string>('FIREBASE_EMAIL_PASSWORD'),
        },
      });

      const mailOptions = {
        from: this.configService.get<string>('FIREBASE_EMAIL_FROM'),
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.htmlContent,
        text: emailData.textContent,
        attachments: emailData.attachments,
      };

      const result = await transport.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to: ${emailData.to}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to send email: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Validate push token
   */
  async validatePushToken(token: string) {
    try {
      // Send a silent test message to validate the token
      const testMessage: admin.messaging.Message = {
        token,
        data: { test: 'true' },
        android: { priority: 'high' },
        apns: { headers: { 'apns-priority': '10' } },
      };

      await this.fcm.send(testMessage);
      return true;
    } catch (error) {
      this.logger.warn(`Invalid push token: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Get device registration tokens for a user
   */
  async getUserTokens(userId: string) {
    try {
      // This would typically query your database for user's push tokens
      // For now, returning a mock implementation
      return [];
    } catch (error) {
      this.logger.error(`Failed to get user tokens: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Register push token for a user
   */
  async registerPushToken(pushTokenData: PushTokenDto) {
    try {
      // This would typically save the token to your database
      // For now, returning a mock implementation
      this.logger.log(`Registered push token for user: ${pushTokenData.userId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to register push token: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Remove push token for a user
   */
  async removePushToken(userId: string, token: string) {
    try {
      // This would typically remove the token from your database
      // For now, returning a mock implementation
      this.logger.log(`Removed push token for user: ${userId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to remove push token: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Track notification analytics
   */
  async trackNotificationAnalytics(analytics: NotificationAnalyticsDto) {
    try {
      // This would typically save analytics data to your database
      // For now, returning a mock implementation
      this.logger.log(`Tracked notification analytics: ${analytics.notificationId} - ${analytics.status}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to track notification analytics: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get notification priority for Firebase
   */
  private getPriority(priority: NotificationPriority): string {
    const priorityMap = {
      [NotificationPriority.LOW]: 'normal',
      [NotificationPriority.NORMAL]: 'normal',
      [NotificationPriority.HIGH]: 'high',
      [NotificationPriority.URGENT]: 'high',
    };

    return priorityMap[priority] || 'normal';
  }

  /**
   * Create custom notification payload based on type
   */
  private createNotificationPayload(
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>,
  ) {
    const basePayload = {
      title,
      body: message,
      data: {
        type,
        ...data,
      },
    };

    switch (type) {
      case NotificationType.ORDER_STATUS:
        return {
          ...basePayload,
          android: {
            ...basePayload.android,
            notification: {
              ...basePayload.android?.notification,
              clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            },
          },
        };

      case NotificationType.PAYMENT_STATUS:
        return {
          ...basePayload,
          android: {
            ...basePayload.android,
            notification: {
              ...basePayload.android?.notification,
              clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            },
          },
        };

      case NotificationType.LIVE_STREAM:
        return {
          ...basePayload,
          android: {
            ...basePayload.android,
            notification: {
              ...basePayload.android?.notification,
              clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            },
          },
          apns: {
            ...basePayload.apns,
            payload: {
              aps: {
                ...basePayload.apns?.payload?.aps,
                'mutable-content': 1,
                'content-available': 1,
              },
            },
          },
        };

      default:
        return basePayload;
    }
  }

  /**
   * Handle notification delivery failures
   */
  async handleDeliveryFailure(results: admin.messaging.BatchResponse) {
    try {
      const failedTokens = [];
      
      if (results.failureCount > 0) {
        results.responses.forEach((response, index) => {
          if (!response.success) {
            const error = response.error;
            
            if (error?.code === 'messaging/registration-token-not-registered' ||
                error?.code === 'messaging/invalid-registration-token') {
              // Token is invalid, remove it from database
              failedTokens.push({
                token: results.multicastId ? `token_${index}` : 'unknown',
                error: error?.message,
                action: 'remove',
              });
            } else {
              // Other error, log it but don't remove token
              failedTokens.push({
                token: results.multicastId ? `token_${index}` : 'unknown',
                error: error?.message,
                action: 'retry',
              });
            }
          }
        });
      }

      if (failedTokens.length > 0) {
        this.logger.warn(`Delivery failures detected: ${failedTokens.length} tokens failed`);
        // Here you would typically update your database to remove invalid tokens
      }

      return failedTokens;
    } catch (error) {
      this.logger.error(`Failed to handle delivery failures: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Get Firebase messaging statistics
   */
  async getMessagingStats() {
    try {
      // This would typically query your analytics database
      // For now, returning mock data
      return {
        totalSent: 0,
        totalDelivered: 0,
        totalFailed: 0,
        totalOpened: 0,
        deliveryRate: 0,
        openRate: 0,
      };
    } catch (error) {
      this.logger.error(`Failed to get messaging stats: ${(error as Error).message}`);
      return null;
    }
  }
}