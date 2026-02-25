import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { 
  NotificationType, 
  NotificationPriority,
  PushTokenDto,
  NotificationAnalyticsDto 
} from '../dto/notifications.dto';

interface OneSignalNotification {
  app_id: string;
  contents: Record<string, string>;
  headings?: Record<string, string>;
  subtitle?: Record<string, string>;
  data?: Record<string, any>;
  include_player_ids?: string[];
  include_external_user_ids?: string[];
  included_segments?: string[];
  excluded_segments?: string[];
  filters?: any[];
  content_available?: boolean;
  mutable_content?: boolean;
  target_channel?: string[];
  background_image?: string;
  small_icon?: string;
  large_icon?: string;
  ios_sound?: string;
  android_sound?: string;
  android_channel_id?: string;
  android_group?: string;
  android_group_message?: Record<string, string>;
  android_visibility?: number;
  android_led_color?: string;
  android_accent_color?: string;
  android_actions?: any[];
  ios_badgeType?: string;
  ios_badgeCount?: number;
  ios_attachments?: any[];
  thread_id?: string;
  collapse_id?: string;
  send_after?: string;
  delayed_option?: string;
  delivery_time_of_day?: string;
  ttl?: number;
  priority?: number;
  email_subject?: string;
  email_body?: string;
  email_from_name?: string;
  email_from_address?: string;
  reply_to?: string;
  template_id?: string;
  template_data?: Record<string, any>;
  web_url?: string;
  web_buttons?: any[];
  app_url?: string;
  safari_url?: string;
  huawei_app_id?: string;
  huawei_app_key?: string;
  chrome_web_icon?: string;
  chrome_web_image?: string;
  chrome_web_badge?: string;
  chrome_web_badge_count?: string;
  firefox_icon?: string;
  firefox_badge?: string;
  firefox_badge_count?: string;
  url?: string;
  web_push_topic?: string;
  apns_push_type_override?: string;
  interruption_level?: string;
  relevance_score?: number;
  ical_url?: string;
  ical_filename?: string;
}

interface OneSignalPlayer {
  identifier: string;
  session_count: number;
  language: string;
  timezone: number;
  game_version: string;
  device_os: string;
  device_type: number;
  device_model: string;
  ad_id: string;
  rooted: boolean;
  net_type: number;
  carrier: string;
  web_auth: string;
  notification_types: number;
  test_type: number;
  amount_spent: number;
  created_at: number;
  invalid_identifier: boolean;
  safari_push_token?: string;
}

@Injectable()
export class OneSignalService implements OnModuleInit {
  private readonly logger = new Logger(OneSignalService.name);
  private readonly appId: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.appId = this.configService.get<string>('ONESIGNAL_APP_ID');
    this.apiKey = this.configService.get<string>('ONESIGNAL_API_KEY');
    this.baseUrl = 'https://onesignal.com/api/v1';
  }

  async onModuleInit() {
    if (!this.appId || !this.apiKey) {
      this.logger.warn('OneSignal credentials not configured');
    } else {
      this.logger.log('OneSignal service initialized');
    }
  }

  /**
   * Send notification to specific players
   */
  async sendNotification(
    playerIds: string[],
    title: string,
    message: string,
    data?: Record<string, any>,
    options?: {
      imageUrl?: string;
      actionUrl?: string;
      priority?: NotificationPriority;
      subtitle?: string;
    },
  ) {
    try {
      const notification: OneSignalNotification = {
        app_id: this.appId,
        contents: this.getLocalizedContent(message),
        headings: this.getLocalizedContent(title),
        include_player_ids: playerIds,
        data: {
          type: data?.type || 'general',
          ...data,
        },
        priority: this.getOneSignalPriority(options?.priority || NotificationPriority.NORMAL),
        mutable_content: true,
        content_available: true,
      };

      if (options?.imageUrl) {
        notification.large_icon = options.imageUrl;
        notification.chrome_web_image = options.imageUrl;
        notification.firefox_icon = options.imageUrl;
      }

      if (options?.subtitle) {
        notification.subtitle = this.getLocalizedContent(options.subtitle);
      }

      if (options?.actionUrl) {
        notification.url = options.actionUrl;
        notification.web_url = options.actionUrl;
        notification.app_url = options.actionUrl;
      }

      const response = await axios.post(
        `${this.baseUrl}/notifications`,
        notification,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`,
          },
        },
      );

      this.logger.log(`OneSignal notification sent to ${playerIds.length} players`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to send OneSignal notification: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Send notification to external user IDs
   */
  async sendNotificationToExternalUsers(
    externalUserIds: string[],
    title: string,
    message: string,
    data?: Record<string, any>,
    options?: {
      imageUrl?: string;
      actionUrl?: string;
      priority?: NotificationPriority;
      subtitle?: string;
    },
  ) {
    try {
      const notification: OneSignalNotification = {
        app_id: this.appId,
        contents: this.getLocalizedContent(message),
        headings: this.getLocalizedContent(title),
        include_external_user_ids: externalUserIds,
        data: {
          type: data?.type || 'general',
          ...data,
        },
        priority: this.getOneSignalPriority(options?.priority || NotificationPriority.NORMAL),
        mutable_content: true,
        content_available: true,
      };

      if (options?.imageUrl) {
        notification.large_icon = options.imageUrl;
        notification.chrome_web_image = options.imageUrl;
        notification.firefox_icon = options.imageUrl;
      }

      if (options?.subtitle) {
        notification.subtitle = this.getLocalizedContent(options.subtitle);
      }

      if (options?.actionUrl) {
        notification.url = options.actionUrl;
        notification.web_url = options.actionUrl;
        notification.app_url = options.actionUrl;
      }

      const response = await axios.post(
        `${this.baseUrl}/notifications`,
        notification,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`,
          },
        },
      );

      this.logger.log(`OneSignal notification sent to ${externalUserIds.length} external users`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to send OneSignal notification to external users: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Send notification to segments
   */
  async sendNotificationToSegments(
    segments: string[],
    title: string,
    message: string,
    data?: Record<string, any>,
    options?: {
      imageUrl?: string;
      actionUrl?: string;
      priority?: NotificationPriority;
      subtitle?: string;
    },
  ) {
    try {
      const notification: OneSignalNotification = {
        app_id: this.appId,
        contents: this.getLocalizedContent(message),
        headings: this.getLocalizedContent(title),
        included_segments: segments,
        data: {
          type: data?.type || 'general',
          ...data,
        },
        priority: this.getOneSignalPriority(options?.priority || NotificationPriority.NORMAL),
        mutable_content: true,
        content_available: true,
      };

      if (options?.imageUrl) {
        notification.large_icon = options.imageUrl;
        notification.chrome_web_image = options.imageUrl;
        notification.firefox_icon = options.imageUrl;
      }

      if (options?.subtitle) {
        notification.subtitle = this.getLocalizedContent(options.subtitle);
      }

      if (options?.actionUrl) {
        notification.url = options.actionUrl;
        notification.web_url = options.actionUrl;
        notification.app_url = options.actionUrl;
      }

      const response = await axios.post(
        `${this.baseUrl}/notifications`,
        notification,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`,
          },
        },
      );

      this.logger.log(`OneSignal notification sent to segments: ${segments.join(', ')}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to send OneSignal notification to segments: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Create segment
   */
  async createSegment(name: string, filters: any[]) {
    try {
      const segment = {
        name,
        filters,
      };

      const response = await axios.post(
        `${this.baseUrl}/segments`,
        { app_id: this.appId, ...segment },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`,
          },
        },
      );

      this.logger.log(`OneSignal segment created: ${name}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to create OneSignal segment: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get player information
   */
  async getPlayer(playerId: string): Promise<OneSignalPlayer | null> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/players/${playerId}?app_id=${this.appId}`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get OneSignal player: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Get all players for a user
   */
  async getPlayersByExternalUserId(externalUserId: string): Promise<OneSignalPlayer[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/players?app_id=${this.appId}&limit=300&offset=0&external_user_id=${externalUserId}`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`,
          },
        },
      );

      return response.data.players;
    } catch (error) {
      this.logger.error(`Failed to get OneSignal players: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Update player
   */
  async updatePlayer(playerId: string, updates: Partial<OneSignalPlayer>) {
    try {
      const response = await axios.put(
        `${this.baseUrl}/players/${playerId}`,
        { app_id: this.appId, ...updates },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`,
          },
        },
      );

      this.logger.log(`OneSignal player updated: ${playerId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to update OneSignal player: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Delete player
   */
  async deletePlayer(playerId: string) {
    try {
      await axios.delete(
        `${this.baseUrl}/players/${playerId}?app_id=${this.appId}`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`,
          },
        },
      );

      this.logger.log(`OneSignal player deleted: ${playerId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to delete OneSignal player: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Register push token
   */
  async registerPushToken(pushTokenData: PushTokenDto) {
    try {
      const playerData = {
        app_id: this.appId,
        device_type: pushTokenData.platform === 'ios' ? 0 : 1,
        identifier: pushTokenData.token,
        external_user_id: pushTokenData.userId,
        language: 'en',
        timezone: -25200, // UTC
        game_version: pushTokenData.appVersion || '1.0.0',
        device_os: pushTokenData.platform,
        test_type: 1,
      };

      const response = await axios.post(
        `${this.baseUrl}/players`,
        playerData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`,
          },
        },
      );

      this.logger.log(`OneSignal player registered for user: ${pushTokenData.userId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to register OneSignal player: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get notification outcomes
   */
  async getNotificationOutcomes(notificationId: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/notifications/${notificationId}/outcomes?app_id=${this.appId}`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get OneSignal notification outcomes: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Get app analytics
   */
  async getAppAnalytics(filters?: {
    startDate?: string;
    endDate?: string;
    platform?: string;
  }) {
    try {
      const params = new URLSearchParams({
        app_id: this.appId,
        ...(filters?.startDate && { start_date: filters.startDate }),
        ...(filters?.endDate && { end_date: filters.endDate }),
        ...(filters?.platform && { platform: filters.platform }),
      });

      const response = await axios.get(
        `${this.baseUrl}/apps/${this.appId}/stats?${params.toString()}`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get OneSignal app analytics: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Track notification analytics
   */
  async trackNotificationAnalytics(analytics: NotificationAnalyticsDto) {
    try {
      // OneSignal automatically tracks most analytics
      // This would be used for custom tracking
      this.logger.log(`Tracked OneSignal notification analytics: ${analytics.notificationId} - ${analytics.status}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to track OneSignal notification analytics: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get localized content
   */
  private getLocalizedContent(content: string): Record<string, string> {
    return {
      en: content,
      vi: content,
      zh: content,
      th: content,
      id: content,
      ms: content,
      tl: content,
    };
  }

  /**
   * Get OneSignal priority
   */
  private getOneSignalPriority(priority: NotificationPriority): number {
    const priorityMap = {
      [NotificationPriority.LOW]: 5,
      [NotificationPriority.NORMAL]: 7,
      [NotificationPriority.HIGH]: 9,
      [NotificationPriority.URGENT]: 10,
    };

    return priorityMap[priority] || 7;
  }

  /**
   * Create notification filters
   */
  private createFilters(filters: Record<string, any>): any[] {
    const oneSignalFilters = [];

    Object.entries(filters).forEach(([field, value]) => {
      if (Array.isArray(value)) {
        oneSignalFilters.push({
          field,
          operator: 'in',
          value,
        });
      } else {
        oneSignalFilters.push({
          field,
          operator: 'eq',
          value,
        });
      }
    });

    return oneSignalFilters;
  }

  /**
   * Handle notification delivery failures
   */
  async handleDeliveryFailure(results: any) {
    try {
      const failedPlayers = [];
      
      if (results.errors && results.errors.length > 0) {
        results.errors.forEach((error: any) => {
          if (error.includes('Invalid player ID') || error.includes('No users with this id found')) {
            // Player ID is invalid, remove it from database
            failedPlayers.push({
              playerId: error.player_id || 'unknown',
              error: error,
              action: 'remove',
            });
          } else {
            // Other error, log it but don't remove player
            failedPlayers.push({
              playerId: error.player_id || 'unknown',
              error: error,
              action: 'retry',
            });
          }
        });
      }

      if (failedPlayers.length > 0) {
        this.logger.warn(`OneSignal delivery failures detected: ${failedPlayers.length} players failed`);
        // Here you would typically update your database to remove invalid players
      }

      return failedPlayers;
    } catch (error) {
      this.logger.error(`Failed to handle OneSignal delivery failures: ${(error as Error).message}`);
      return [];
    }
  }
}