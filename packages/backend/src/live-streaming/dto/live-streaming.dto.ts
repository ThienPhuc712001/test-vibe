import { IsString, IsNumber, IsEnum, IsOptional, IsArray, IsBoolean, Min, Max, IsObject } from 'class-validator';

export enum StreamStatus {
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
  PAUSED = 'paused',
}

export enum StreamType {
  PRODUCT_SHOWCASE = 'product_showcase',
  LIVE_SHOPPING = 'live_shopping',
  AUCTION = 'auction',
  TUTORIAL = 'tutorial',
  Q_AND_A = 'q_and_a',
}

export enum StreamQuality {
  LOW = 'low',
  STANDARD = 'standard',
  HIGH = 'high',
  ULTRA = 'ultra',
}

export enum UserRole {
  HOST = 'host',
  MODERATOR = 'moderator',
  PARTICIPANT = 'participant',
}

export class CreateStreamDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(StreamType)
  type: StreamType;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  productId?: string;

  @IsArray()
  @IsOptional()
  productIds?: string[];

  @IsString()
  @IsOptional()
  scheduledAt?: string;

  @IsNumber()
  @IsOptional()
  duration?: number; // in minutes

  @IsEnum(StreamQuality)
  @IsOptional()
  quality?: StreamQuality;

  @IsBoolean()
  @IsOptional()
  enableRecording?: boolean;

  @IsBoolean()
  @IsOptional()
  enableChat?: boolean;

  @IsBoolean()
  @IsOptional()
  enableScreenShare?: boolean;

  @IsBoolean()
  @IsOptional()
  enableWhiteboard?: boolean;

  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;

  @IsString()
  @IsOptional()
  password?: string;

  @IsNumber()
  @IsOptional()
  maxParticipants?: number;

  @IsString()
  @IsOptional()
  thumbnail?: string;

  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;

  @IsArray()
  @IsOptional()
  tags?: string[];
}

export class UpdateStreamDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(StreamStatus)
  @IsOptional()
  status?: StreamStatus;

  @IsString()
  @IsOptional()
  scheduledAt?: string;

  @IsNumber()
  @IsOptional()
  duration?: number;

  @IsEnum(StreamQuality)
  @IsOptional()
  quality?: StreamQuality;

  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;
}

export class JoinStreamDto {
  @IsString()
  streamId: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}

export class LeaveStreamDto {
  @IsString()
  streamId: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class StartStreamDto {
  @IsString()
  streamId: string;

  @IsEnum(StreamQuality)
  @IsOptional()
  quality?: StreamQuality;

  @IsBoolean()
  @IsOptional()
  enableRecording?: boolean;
}

export class EndStreamDto {
  @IsString()
  streamId: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsBoolean()
  @IsOptional()
  saveRecording?: boolean;
}

export class PauseStreamDto {
  @IsString()
  streamId: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class ResumeStreamDto {
  @IsString()
  streamId: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class SendChatMessageDto {
  @IsString()
  streamId: string;

  @IsString()
  message: string;

  @IsString()
  @IsOptional()
  parentId?: string;

  @IsString()
  @IsOptional()
  type?: 'text' | 'emoji' | 'image' | 'product';
}

export class SendGiftDto {
  @IsString()
  streamId: string;

  @IsString()
  giftId: string;

  @IsNumber()
  @Min(1)
  @Max(100)
  quantity: number;

  @IsString()
  @IsOptional()
  message?: string;
}

export class CreateProductShowcaseDto {
  @IsString()
  streamId: string;

  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  @Max(30)
  duration: number; // in minutes

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  discount?: number; // percentage

  @IsBoolean()
  @IsOptional()
  enableChat?: boolean;
}

export class UpdateStreamSettingsDto {
  @IsString()
  streamId: string;

  @IsBoolean()
  @IsOptional()
  enableChat?: boolean;

  @IsBoolean()
  @IsOptional()
  enableScreenShare?: boolean;

  @IsBoolean()
  @IsOptional()
  enableWhiteboard?: boolean;

  @IsBoolean()
  @IsOptional()
  muteParticipants?: boolean;

  @IsBoolean()
  @IsOptional()
  hideParticipantCount?: boolean;
}

export class StreamAnalyticsDto {
  @IsString()
  streamId: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsOptional()
  @IsArray()
  metrics?: string[];
}

export class StreamInvitationDto {
  @IsString()
  streamId: string;

  @IsArray()
  userIds: string[];

  @IsString()
  @IsOptional()
  message?: string;
}

export class BanUserDto {
  @IsString()
  streamId: string;

  @IsString()
  userId: string;

  @IsString()
  reason: string;

  @IsNumber()
  @Min(1)
  @Max(1440) // 24 hours in minutes
  duration?: number; // in minutes
}

export class UnbanUserDto {
  @IsString()
  streamId: string;

  @IsString()
  userId: string;
}

export class MakeModeratorDto {
  @IsString()
  streamId: string;

  @IsString()
  userId: string;

  @IsEnum(UserRole)
  role: UserRole;
}

export class RemoveModeratorDto {
  @IsString()
  streamId: string;

  @IsString()
  userId: string;
}

export class StreamWebhookDto {
  @IsString()
  type: string;

  @IsString()
  data: string;

  @IsOptional()
  @IsString()
  signature?: string;

  @IsOptional()
  @IsString()
  provider?: string;
}