import { IsString, IsNumber, IsEnum, IsArray, IsOptional, IsDate, IsBoolean, Min, Max, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AnalyticsType {
  SALES = 'SALES',
  REVENUE = 'REVENUE',
  TRAFFIC = 'TRAFFIC',
  CONVERSION = 'CONVERSION',
  USER_BEHAVIOR = 'USER_BEHAVIOR',
  PRODUCT_PERFORMANCE = 'PRODUCT_PERFORMANCE',
  SELLER_PERFORMANCE = 'SELLER_PERFORMANCE',
  INVENTORY = 'INVENTORY',
  MARKETING = 'MARKETING',
  FINANCIAL = 'FINANCIAL'
}

export enum TimePeriod {
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY'
}

export enum MetricType {
  COUNT = 'COUNT',
  SUM = 'SUM',
  AVERAGE = 'AVERAGE',
  PERCENTAGE = 'PERCENTAGE',
  RATE = 'RATE',
  RATIO = 'RATIO'
}

export enum ComparisonType {
  PREVIOUS_PERIOD = 'PREVIOUS_PERIOD',
  SAME_PERIOD_LAST_YEAR = 'SAME_PERIOD_LAST_YEAR',
  CUSTOM_DATE_RANGE = 'CUSTOM_DATE_RANGE'
}

export class MetricDto {
  @ApiProperty({ description: 'Metric name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Metric type', enum: MetricType })
  @IsEnum(MetricType)
  type: MetricType;

  @ApiProperty({ description: 'Metric value' })
  @IsNumber()
  value: number;

  @ApiPropertyOptional({ description: 'Metric unit' })
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ description: 'Previous period value for comparison' })
  @IsNumber()
  previousValue?: number;

  @ApiPropertyOptional({ description: 'Percentage change' })
  @IsNumber()
  changePercentage?: number;

  @ApiPropertyOptional({ description: 'Is positive change' })
  @IsBoolean()
  isPositive?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  metadata?: any;
}

export class DimensionDto {
  @ApiProperty({ description: 'Dimension name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Dimension value' })
  @IsString()
  value: string;

  @ApiPropertyOptional({ description: 'Dimension count' })
  @IsNumber()
  count?: number;

  @ApiPropertyOptional({ description: 'Dimension percentage' })
  @IsNumber()
  percentage?: number;
}

export class AnalyticsQueryDto {
  @ApiPropertyOptional({ description: 'Analytics type', enum: AnalyticsType })
  @IsEnum(AnalyticsType)
  type?: AnalyticsType;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date' })
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Time period', enum: TimePeriod })
  @IsEnum(TimePeriod)
  timePeriod?: TimePeriod;

  @ApiPropertyOptional({ description: 'Comparison type', enum: ComparisonType })
  @IsEnum(ComparisonType)
  comparisonType?: ComparisonType;

  @ApiPropertyOptional({ description: 'Comparison start date' })
  @IsDate()
  @Type(() => Date)
  comparisonStartDate?: Date;

  @ApiPropertyOptional({ description: 'Comparison end date' })
  @IsDate()
  @Type(() => Date)
  comparisonEndDate?: Date;

  @ApiPropertyOptional({ description: 'Metrics to include' })
  @IsArray()
  @IsString({ each: true })
  metrics?: string[];

  @ApiPropertyOptional({ description: 'Dimensions to group by' })
  @IsArray()
  @IsString({ each: true })
  dimensions?: string[];

  @ApiPropertyOptional({ description: 'Filters' })
  @IsObject()
  filters?: any;

  @ApiPropertyOptional({ description: 'Sort by' })
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsEnum(['asc', 'desc'])
  sortOrder?: string = 'desc';

  @ApiPropertyOptional({ description: 'Limit results' })
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number;

  @ApiPropertyOptional({ description: 'Offset results' })
  @IsNumber()
  @Min(0)
  offset?: number;
}

export class SalesAnalyticsDto {
  @ApiPropertyOptional({ description: 'Start date' })
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date' })
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Time period', enum: TimePeriod })
  @IsEnum(TimePeriod)
  timePeriod?: TimePeriod;

  @ApiPropertyOptional({ description: 'Group by' })
  @IsEnum(['day', 'week', 'month', 'quarter', 'year'])
  groupBy?: string = 'day';

  @ApiPropertyOptional({ description: 'Seller ID' })
  @IsString()
  sellerId?: string;

  @ApiPropertyOptional({ description: 'Shop ID' })
  @IsString()
  shopId?: string;

  @ApiPropertyOptional({ description: 'Product ID' })
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Include comparison' })
  @IsBoolean()
  includeComparison?: boolean = true;

  @ApiPropertyOptional({ description: 'Include forecast' })
  @IsBoolean()
  includeForecast?: boolean = false;
}

export class RevenueAnalyticsDto {
  @ApiPropertyOptional({ description: 'Start date' })
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date' })
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Time period', enum: TimePeriod })
  @IsEnum(TimePeriod)
  timePeriod?: TimePeriod;

  @ApiPropertyOptional({ description: 'Group by' })
  @IsEnum(['day', 'week', 'month', 'quarter', 'year'])
  groupBy?: string = 'day';

  @ApiPropertyOptional({ description: 'Revenue type' })
  @IsEnum(['GROSS', 'NET', 'PROFIT'])
  revenueType?: string = 'GROSS';

  @ApiPropertyOptional({ description: 'Seller ID' })
  @IsString()
  sellerId?: string;

  @ApiPropertyOptional({ description: 'Shop ID' })
  @IsString()
  shopId?: string;

  @ApiPropertyOptional({ description: 'Include breakdown by payment method' })
  @IsBoolean()
  includePaymentBreakdown?: boolean = false;

  @ApiPropertyOptional({ description: 'Include breakdown by category' })
  @IsBoolean()
  includeCategoryBreakdown?: boolean = false;
}

export class TrafficAnalyticsDto {
  @ApiPropertyOptional({ description: 'Start date' })
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date' })
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Time period', enum: TimePeriod })
  @IsEnum(TimePeriod)
  timePeriod?: TimePeriod;

  @ApiPropertyOptional({ description: 'Group by' })
  @IsEnum(['hour', 'day', 'week', 'month'])
  groupBy?: string = 'day';

  @ApiPropertyOptional({ description: 'Traffic source' })
  @IsEnum(['ALL', 'DIRECT', 'ORGANIC', 'PAID', 'SOCIAL', 'REFERRAL', 'EMAIL'])
  trafficSource?: string = 'ALL';

  @ApiPropertyOptional({ description: 'Device type' })
  @IsEnum(['ALL', 'DESKTOP', 'MOBILE', 'TABLET'])
  deviceType?: string = 'ALL';

  @ApiPropertyOptional({ description: 'Include page views' })
  @IsBoolean()
  includePageViews?: boolean = true;

  @ApiPropertyOptional({ description: 'Include unique visitors' })
  @IsBoolean()
  includeUniqueVisitors?: boolean = true;

  @ApiPropertyOptional({ description: 'Include bounce rate' })
  @IsBoolean()
  includeBounceRate?: boolean = true;

  @ApiPropertyOptional({ description: 'Include session duration' })
  @IsBoolean()
  includeSessionDuration?: boolean = true;
}

export class ConversionAnalyticsDto {
  @ApiPropertyOptional({ description: 'Start date' })
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date' })
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Time period', enum: TimePeriod })
  @IsEnum(TimePeriod)
  timePeriod?: TimePeriod;

  @ApiPropertyOptional({ description: 'Conversion funnel' })
  @IsEnum(['PURCHASE', 'SIGNUP', 'CART_ADD', 'CHECKOUT'])
  conversionFunnel?: string = 'PURCHASE';

  @ApiPropertyOptional({ description: 'Group by' })
  @IsEnum(['day', 'week', 'month'])
  groupBy?: string = 'day';

  @ApiPropertyOptional({ description: 'Traffic source' })
  @IsEnum(['ALL', 'DIRECT', 'ORGANIC', 'PAID', 'SOCIAL', 'REFERRAL', 'EMAIL'])
  trafficSource?: string = 'ALL';

  @ApiPropertyOptional({ description: 'Device type' })
  @IsEnum(['ALL', 'DESKTOP', 'MOBILE', 'TABLET'])
  deviceType?: string = 'ALL';

  @ApiPropertyOptional({ description: 'Include funnel breakdown' })
  @IsBoolean()
  includeFunnelBreakdown?: boolean = true;

  @ApiPropertyOptional({ description: 'Include conversion by product' })
  @IsBoolean()
  includeProductBreakdown?: boolean = false;
}

export class UserBehaviorAnalyticsDto {
  @ApiPropertyOptional({ description: 'Start date' })
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date' })
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({ description: 'User segment' })
  @IsEnum(['ALL', 'NEW', 'RETURNING', 'VIP', 'INACTIVE'])
  userSegment?: string = 'ALL';

  @ApiPropertyOptional({ description: 'Behavior type' })
  @IsEnum(['BROWSING', 'SEARCHING', 'CART_ACTIVITY', 'PURCHASE', 'REVIEW'])
  behaviorType?: string = 'BROWSING';

  @ApiPropertyOptional({ description: 'Group by' })
  @IsEnum(['day', 'week', 'month'])
  groupBy?: string = 'day';

  @ApiPropertyOptional({ description: 'Include session data' })
  @IsBoolean()
  includeSessionData?: boolean = true;

  @ApiPropertyOptional({ description: 'Include page path analysis' })
  @IsBoolean()
  includePagePathAnalysis?: boolean = false;

  @ApiPropertyOptional({ description: 'Include device analysis' })
  @IsBoolean()
  includeDeviceAnalysis?: boolean = false;
}

export class ProductPerformanceAnalyticsDto {
  @ApiPropertyOptional({ description: 'Start date' })
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date' })
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Product ID' })
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Seller ID' })
  @IsString()
  sellerId?: string;

  @ApiPropertyOptional({ description: 'Shop ID' })
  @IsString()
  shopId?: string;

  @ApiPropertyOptional({ description: 'Sort by' })
  @IsEnum(['views', 'sales', 'revenue', 'conversion_rate', 'rating'])
  sortBy?: string = 'sales';

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsEnum(['asc', 'desc'])
  sortOrder?: string = 'desc';

  @ApiPropertyOptional({ description: 'Limit results' })
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @ApiPropertyOptional({ description: 'Include inventory data' })
  @IsBoolean()
  includeInventoryData?: boolean = false;

  @ApiPropertyOptional({ description: 'Include review data' })
  @IsBoolean()
  includeReviewData?: boolean = true;
}

export class SellerPerformanceAnalyticsDto {
  @ApiPropertyOptional({ description: 'Start date' })
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date' })
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Seller ID' })
  @IsString()
  sellerId?: string;

  @ApiPropertyOptional({ description: 'Shop ID' })
  @IsString()
  shopId?: string;

  @ApiPropertyOptional({ description: 'Sort by' })
  @IsEnum(['sales', 'revenue', 'products', 'rating', 'response_time'])
  sortBy?: string = 'revenue';

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsEnum(['asc', 'desc'])
  sortOrder?: string = 'desc';

  @ApiPropertyOptional({ description: 'Limit results' })
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @ApiPropertyOptional({ description: 'Include order data' })
  @IsBoolean()
  includeOrderData?: boolean = true;

  @ApiPropertyOptional({ description: 'Include customer satisfaction' })
  @IsBoolean()
  includeCustomerSatisfaction?: boolean = true;

  @ApiPropertyOptional({ description: 'Include performance metrics' })
  @IsBoolean()
  includePerformanceMetrics?: boolean = true;
}

export class InventoryAnalyticsDto {
  @ApiPropertyOptional({ description: 'Seller ID' })
  @IsString()
  sellerId?: string;

  @ApiPropertyOptional({ description: 'Shop ID' })
  @IsString()
  shopId?: string;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Stock status' })
  @IsEnum(['ALL', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'])
  stockStatus?: string = 'ALL';

  @ApiPropertyOptional({ description: 'Include turnover analysis' })
  @IsBoolean()
  includeTurnoverAnalysis?: boolean = true;

  @ApiPropertyOptional({ description: 'Include valuation' })
  @IsBoolean()
  includeValuation?: boolean = false;

  @ApiPropertyOptional({ description: 'Include recommendations' })
  @IsBoolean()
  includeRecommendations?: boolean = true;
}

export class MarketingAnalyticsDto {
  @ApiPropertyOptional({ description: 'Start date' })
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date' })
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Campaign ID' })
  @IsString()
  campaignId?: string;

  @ApiPropertyOptional({ description: 'Campaign type' })
  @IsEnum(['ALL', 'EMAIL', 'SOCIAL', 'PAID_SEARCH', 'DISPLAY', 'INFLUENCER'])
  campaignType?: string = 'ALL';

  @ApiPropertyOptional({ description: 'Group by' })
  @IsEnum(['day', 'week', 'month'])
  groupBy?: string = 'day';

  @ApiPropertyOptional({ description: 'Include ROI analysis' })
  @IsBoolean()
  includeROIAnalysis?: boolean = true;

  @ApiPropertyOptional({ description: 'Include attribution' })
  @IsBoolean()
  includeAttribution?: boolean = false;

  @ApiPropertyOptional({ description: 'Include cohort analysis' })
  @IsBoolean()
  includeCohortAnalysis?: boolean = false;
}

export class FinancialAnalyticsDto {
  @ApiPropertyOptional({ description: 'Start date' })
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date' })
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Time period', enum: TimePeriod })
  @IsEnum(TimePeriod)
  timePeriod?: TimePeriod;

  @ApiPropertyOptional({ description: 'Group by' })
  @IsEnum(['day', 'week', 'month', 'quarter', 'year'])
  groupBy?: string = 'month';

  @ApiPropertyOptional({ description: 'Financial type' })
  @IsEnum(['ALL', 'REVENUE', 'COSTS', 'PROFIT', 'MARGINS'])
  financialType?: string = 'ALL';

  @ApiPropertyOptional({ description: 'Include breakdown by category' })
  @IsBoolean()
  includeCategoryBreakdown?: boolean = true;

  @ApiPropertyOptional({ description: 'Include forecast' })
  @IsBoolean()
  includeForecast?: boolean = false;

  @ApiPropertyOptional({ description: 'Include variance analysis' })
  @IsBoolean()
  includeVarianceAnalysis?: boolean = false;
}

export class DashboardAnalyticsDto {
  @ApiPropertyOptional({ description: 'Dashboard type' })
  @IsEnum(['OVERVIEW', 'SALES', 'MARKETING', 'FINANCIAL', 'OPERATIONS'])
  dashboardType?: string = 'OVERVIEW';

  @ApiPropertyOptional({ description: 'Time period', enum: TimePeriod })
  @IsEnum(TimePeriod)
  timePeriod?: TimePeriod;

  @ApiPropertyOptional({ description: 'Seller ID' })
  @IsString()
  sellerId?: string;

  @ApiPropertyOptional({ description: 'Shop ID' })
  @IsString()
  shopId?: string;

  @ApiPropertyOptional({ description: 'Custom widgets' })
  @IsArray()
  @IsString({ each: true })
  widgets?: string[];

  @ApiPropertyOptional({ description: 'Refresh interval (seconds)' })
  @IsNumber()
  @Min(30)
  refreshInterval?: number = 300;
}

export class AnalyticsExportDto {
  @ApiProperty({ description: 'Analytics type', enum: AnalyticsType })
  @IsEnum(AnalyticsType)
  type: AnalyticsType;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date' })
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Export format' })
  @IsEnum(['csv', 'excel', 'pdf', 'json'])
  format?: string = 'csv';

  @ApiPropertyOptional({ description: 'Include charts' })
  @IsBoolean()
  includeCharts?: boolean = false;

  @ApiPropertyOptional({ description: 'Email report to' })
  @IsArray()
  @IsString({ each: true })
  emailTo?: string[];

  @ApiPropertyOptional({ description: 'Report title' })
  @IsString()
  reportTitle?: string;

  @ApiPropertyOptional({ description: 'Custom filters' })
  @IsObject()
  customFilters?: any;
}