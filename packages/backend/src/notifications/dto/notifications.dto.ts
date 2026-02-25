import { IsString, IsOptional, IsNumber, IsEnum, IsArray, IsObject, IsBoolean } from 'class-validator';

export enum NotificationType {
  ORDER_STATUS = 'order_status',
  PAYMENT_STATUS = 'payment_status',
  SHIPPING_STATUS = 'shipping_status',
  PRODUCT_UPDATE = 'product_update',
  PROMOTION = 'promotion',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  MESSAGE = 'message',
  REVIEW = 'review',
  FOLLOW = 'follow',
  LIKE = 'like',
  COMMENT = 'comment',
  LIVE_STREAM = 'live_stream',
  WISHLIST = 'wishlist',
  CART_ABANDONED = 'cart_abandoned',
  PRICE_DROP = 'price_drop',
  STOCK_ALERT = 'stock_alert',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum NotificationChannel {
  PUSH = 'push',
  EMAIL = 'email',
  SMS = 'sms',
  IN_APP = 'in_app',
  WEBSOCKET = 'websocket',
}

export class CreateNotificationDto {
  @IsString()
  userId: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority = NotificationPriority.NORMAL;

  @IsArray()
  @IsOptional()
  channels?: NotificationChannel[] = [NotificationChannel.IN_APP];

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  actionUrl?: string;

  @IsBoolean()
  @IsOptional()
  isRead?: boolean = false;

  @IsString()
  @IsOptional()
  scheduledAt?: string;
}

export class UpdateNotificationDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @IsArray()
  @IsOptional()
  channels?: NotificationChannel[];

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  actionUrl?: string;

  @IsBoolean()
  @IsOptional()
  isRead?: boolean;
}

export class SendNotificationDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsArray()
  @IsOptional()
  userIds?: string[];

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority = NotificationPriority.NORMAL;

  @IsArray()
  @IsOptional()
  channels?: NotificationChannel[] = [NotificationChannel.IN_APP];

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  actionUrl?: string;

  @IsString()
  @IsOptional()
  scheduledAt?: string;
}

export class BulkNotificationDto {
  @IsArray()
  notifications: CreateNotificationDto[];
}

export class MarkAsReadDto {
  @IsArray()
  notificationIds: string[];
}

export class NotificationQueryDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @IsBoolean()
  @IsOptional()
  isRead?: boolean;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @IsEnum(['createdAt', 'updatedAt', 'priority', 'readAt'])
  @IsOptional()
  sortBy?: string = 'createdAt';

  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: string = 'desc';
}

export class NotificationSettingsDto {
  @IsString()
  userId: string;

  @IsObject()
  settings: Record<NotificationType, {
    enabled: boolean;
    channels: NotificationChannel[];
  }>;
}

export class UpdateNotificationSettingsDto {
  @IsObject()
  settings: Record<NotificationType, {
    enabled: boolean;
    channels: NotificationChannel[];
  }>;
}

export class PushTokenDto {
  @IsString()
  userId: string;

  @IsString()
  token: string;

  @IsEnum(['ios', 'android', 'web'])
  platform: string;

  @IsString()
  @IsOptional()
  deviceId?: string;

  @IsString()
  @IsOptional()
  appVersion?: string;
}

export class RemovePushTokenDto {
  @IsString()
  userId: string;

  @IsString()
  token: string;
}

export class EmailNotificationDto {
  @IsString()
  to: string;

  @IsString()
  subject: string;

  @IsString()
  htmlContent: string;

  @IsString()
  @IsOptional()
  textContent?: string;

  @IsObject()
  @IsOptional()
  templateData?: Record<string, any>;

  @IsArray()
  @IsOptional()
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

export class SMSNotificationDto {
  @IsString()
  to: string;

  @IsString()
  message: string;

  @IsString()
  @IsOptional()
  senderId?: string;
}

export class WebSocketMessageDto {
  @IsString()
  event: string;

  @IsString()
  @IsOptional()
  room?: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsObject()
  data: Record<string, any>;

  @IsString()
  @IsOptional()
  timestamp?: string;
}

export class NotificationAnalyticsDto {
  @IsString()
  notificationId: string;

  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @IsEnum(['sent', 'delivered', 'read', 'clicked', 'failed'])
  status: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  deviceId?: string;

  @IsString()
  @IsOptional()
  error?: string;

  @IsString()
  @IsOptional()
  timestamp?: string;
}

export class NotificationStatsDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @IsEnum(NotificationChannel)
  @IsOptional()
  channel?: NotificationChannel;
}

export class CampaignDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority = NotificationPriority.NORMAL;

  @IsArray()
  @IsOptional()
  channels?: NotificationChannel[] = [NotificationChannel.IN_APP];

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  actionUrl?: string;

  @IsArray()
  @IsOptional()
  targetUsers?: string[];

  @IsObject()
  @IsOptional()
  targetFilters?: Record<string, any>;

  @IsString()
  @IsOptional()
  scheduledAt?: string;

  @IsString()
  @IsOptional()
  expiresAt?: string;
}

export class SendCampaignDto {
  @IsString()
  campaignId: string;

  @IsBoolean()
  @IsOptional()
  testMode?: boolean = false;

  @IsNumber()
  @IsOptional()
  batchSize?: number = 1000;

  @IsNumber()
  @IsOptional()
  delayBetweenBatches?: number = 1000; // in milliseconds
}