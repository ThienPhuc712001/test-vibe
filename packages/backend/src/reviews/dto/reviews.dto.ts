import { IsString, IsNumber, IsEnum, IsArray, IsOptional, IsDate, IsBoolean, Min, Max, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FLAGGED = 'FLAGGED'
}

export enum ReviewType {
  PRODUCT = 'PRODUCT',
  SELLER = 'SELLER',
  SHOP = 'SHOP',
  DELIVERY = 'DELIVERY'
}

export enum RatingType {
  STARS = 'STARS',
  LIKES = 'LIKES',
  THUMBS = 'THUMBS'
}

export class ReviewMediaDto {
  @ApiProperty({ description: 'Media URL' })
  @IsString()
  url: string;

  @ApiProperty({ description: 'Media type' })
  @IsEnum(['IMAGE', 'VIDEO', 'AUDIO'])
  type: string;

  @ApiPropertyOptional({ description: 'Media caption' })
  @IsString()
  caption?: string;

  @ApiPropertyOptional({ description: 'Media order' })
  @IsNumber()
  order?: number;
}

export class ReviewRatingDto {
  @ApiProperty({ description: 'Rating category' })
  @IsString()
  category: string;

  @ApiProperty({ description: 'Rating value' })
  @IsNumber()
  @Min(1)
  @Max(5)
  value: number;

  @ApiPropertyOptional({ description: 'Rating comment' })
  @IsString()
  comment?: string;
}

export class CreateReviewDto {
  @ApiProperty({ description: 'Review type', enum: ReviewType })
  @IsEnum(ReviewType)
  type: ReviewType;

  @ApiProperty({ description: 'Target ID (product, seller, shop, or delivery ID)' })
  @IsString()
  targetId: string;

  @ApiProperty({ description: 'Order ID' })
  @IsString()
  orderId: string;

  @ApiProperty({ description: 'Overall rating' })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ description: 'Review title' })
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Review content' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Detailed ratings', type: [ReviewRatingDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewRatingDto)
  ratings?: ReviewRatingDto[];

  @ApiPropertyOptional({ description: 'Review media', type: [ReviewMediaDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewMediaDto)
  media?: ReviewMediaDto[];

  @ApiPropertyOptional({ description: 'Is verified purchase' })
  @IsBoolean()
  isVerifiedPurchase?: boolean;

  @ApiPropertyOptional({ description: 'Is recommended' })
  @IsBoolean()
  isRecommended?: boolean;

  @ApiPropertyOptional({ description: 'Tags' })
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Pros' })
  @IsArray()
  @IsString({ each: true })
  pros?: string[];

  @ApiPropertyOptional({ description: 'Cons' })
  @IsArray()
  @IsString({ each: true })
  cons?: string[];

  @ApiPropertyOptional({ description: 'Would buy again' })
  @IsBoolean()
  wouldBuyAgain?: boolean;

  @ApiPropertyOptional({ description: 'Review visibility' })
  @IsEnum(['PUBLIC', 'PRIVATE', 'FRIENDS_ONLY'])
  visibility?: string;
}

export class UpdateReviewDto {
  @ApiPropertyOptional({ description: 'Review title' })
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Review content' })
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'Overall rating' })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ description: 'Detailed ratings', type: [ReviewRatingDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewRatingDto)
  ratings?: ReviewRatingDto[];

  @ApiPropertyOptional({ description: 'Review media', type: [ReviewMediaDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewMediaDto)
  media?: ReviewMediaDto[];

  @ApiPropertyOptional({ description: 'Is recommended' })
  @IsBoolean()
  isRecommended?: boolean;

  @ApiPropertyOptional({ description: 'Tags' })
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Pros' })
  @IsArray()
  @IsString({ each: true })
  pros?: string[];

  @ApiPropertyOptional({ description: 'Cons' })
  @IsArray()
  @IsString({ each: true })
  cons?: string[];

  @ApiPropertyOptional({ description: 'Would buy again' })
  @IsBoolean()
  wouldBuyAgain?: boolean;

  @ApiPropertyOptional({ description: 'Review visibility' })
  @IsEnum(['PUBLIC', 'PRIVATE', 'FRIENDS_ONLY'])
  visibility?: string;
}

export class ReviewResponseDto {
  @ApiProperty({ description: 'Response content' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Response media', type: [ReviewMediaDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewMediaDto)
  media?: ReviewMediaDto[];
}

export class ReviewVoteDto {
  @ApiProperty({ description: 'Vote type' })
  @IsEnum(['HELPFUL', 'NOT_HELPFUL', 'REPORT'])
  type: string;

  @ApiPropertyOptional({ description: 'Vote reason' })
  @IsString()
  reason?: string;
}

export class ReviewQueryDto {
  @ApiPropertyOptional({ description: 'Page number' })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page' })
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Review type', enum: ReviewType })
  @IsEnum(ReviewType)
  type?: ReviewType;

  @ApiPropertyOptional({ description: 'Target ID' })
  @IsString()
  targetId?: string;

  @ApiPropertyOptional({ description: 'User ID' })
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Order ID' })
  @IsString()
  orderId?: string;

  @ApiPropertyOptional({ description: 'Review status', enum: ReviewStatus })
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;

  @ApiPropertyOptional({ description: 'Minimum rating' })
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  minRating?: number;

  @ApiPropertyOptional({ description: 'Maximum rating' })
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  maxRating?: number;

  @ApiPropertyOptional({ description: 'Has photos' })
  @IsBoolean()
  hasPhotos?: boolean;

  @ApiPropertyOptional({ description: 'Has videos' })
  @IsBoolean()
  hasVideos?: boolean;

  @ApiPropertyOptional({ description: 'Is verified purchase' })
  @IsBoolean()
  isVerifiedPurchase?: boolean;

  @ApiPropertyOptional({ description: 'Is recommended' })
  @IsBoolean()
  isRecommended?: boolean;

  @ApiPropertyOptional({ description: 'Tags' })
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Search term' })
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Sort by' })
  @IsEnum(['createdAt', 'updatedAt', 'rating', 'helpfulCount', 'verified'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsEnum(['asc', 'desc'])
  sortOrder?: string = 'desc';

  @ApiPropertyOptional({ description: 'Start date' })
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date' })
  @IsDate()
  @Type(() => Date)
  endDate?: Date;
}

export class ReviewAnalyticsDto {
  @ApiPropertyOptional({ description: 'Target ID' })
  @IsString()
  targetId?: string;

  @ApiPropertyOptional({ description: 'Review type', enum: ReviewType })
  @IsEnum(ReviewType)
  type?: ReviewType;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date' })
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Group by' })
  @IsEnum(['day', 'week', 'month', 'year'])
  groupBy?: string = 'day';
}

export class BulkReviewUpdateDto {
  @ApiProperty({ description: 'Review IDs' })
  @IsArray()
  @IsString({ each: true })
  reviewIds: string[];

  @ApiProperty({ description: 'Review status', enum: ReviewStatus })
  @IsEnum(ReviewStatus)
  status: ReviewStatus;

  @ApiPropertyOptional({ description: 'Update notes' })
  @IsString()
  notes?: string;
}

export class ReviewExportDto {
  @ApiPropertyOptional({ description: 'Target ID' })
  @IsString()
  targetId?: string;

  @ApiPropertyOptional({ description: 'Review type', enum: ReviewType })
  @IsEnum(ReviewType)
  type?: ReviewType;

  @ApiPropertyOptional({ description: 'Review status', enum: ReviewStatus })
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date' })
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Export format' })
  @IsEnum(['csv', 'excel', 'pdf'])
  format?: string = 'csv';

  @ApiPropertyOptional({ description: 'Include media' })
  @IsBoolean()
  includeMedia?: boolean = false;

  @ApiPropertyOptional({ description: 'Include responses' })
  @IsBoolean()
  includeResponses?: boolean = true;

  @ApiPropertyOptional({ description: 'Include votes' })
  @IsBoolean()
  includeVotes?: boolean = true;
}

export class ReviewModerationDto {
  @ApiProperty({ description: 'Review ID' })
  @IsString()
  reviewId: string;

  @ApiProperty({ description: 'Moderation action' })
  @IsEnum(['APPROVE', 'REJECT', 'FLAG', 'DELETE'])
  action: string;

  @ApiPropertyOptional({ description: 'Moderation reason' })
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Moderation notes' })
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Notify reviewer' })
  @IsBoolean()
  notifyReviewer?: boolean = true;

  @ApiPropertyOptional({ description: 'Custom message to reviewer' })
  @IsString()
  customMessage?: string;
}

export class ReviewSummaryDto {
  @ApiProperty({ description: 'Target ID' })
  @IsString()
  targetId: string;

  @ApiProperty({ description: 'Review type', enum: ReviewType })
  @IsEnum(ReviewType)
  type: ReviewType;

  @ApiPropertyOptional({ description: 'Include breakdown by rating' })
  @IsBoolean()
  includeRatingBreakdown?: boolean = true;

  @ApiPropertyOptional({ description: 'Include sentiment analysis' })
  @IsBoolean()
  includeSentiment?: boolean = true;

  @ApiPropertyOptional({ description: 'Include keyword analysis' })
  @IsBoolean()
  includeKeywords?: boolean = true;

  @ApiPropertyOptional({ description: 'Include trend analysis' })
  @IsBoolean()
  includeTrends?: boolean = true;
}