import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Query, 
  UseGuards,
  HttpStatus,
  HttpCode,
  ValidationPipe,
  UseInterceptors
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { 
  SalesAnalyticsDto,
  RevenueAnalyticsDto,
  TrafficAnalyticsDto,
  ConversionAnalyticsDto,
  UserBehaviorAnalyticsDto,
  ProductPerformanceAnalyticsDto,
  SellerPerformanceAnalyticsDto,
  InventoryAnalyticsDto,
  MarketingAnalyticsDto,
  FinancialAnalyticsDto,
  DashboardAnalyticsDto,
  AnalyticsExportDto
} from './dto/analytics.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ResponseInterceptor } from '../common/interceptors/response.interceptor';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('sales')
  @ApiOperation({ summary: 'Get sales analytics' })
  @ApiResponse({ status: 200, description: 'Sales analytics retrieved successfully' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiQuery({ name: 'groupBy', required: false, enum: ['day', 'week', 'month', 'quarter', 'year'] })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getSalesAnalytics(@Query() query: SalesAnalyticsDto) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Sales analytics retrieved successfully',
      data: await this.analyticsService.getSalesAnalytics(query),
    };
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue analytics' })
  @ApiResponse({ status: 200, description: 'Revenue analytics retrieved successfully' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiQuery({ name: 'revenueType', required: false, enum: ['GROSS', 'NET', 'PROFIT'] })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getRevenueAnalytics(@Query() query: RevenueAnalyticsDto) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Revenue analytics retrieved successfully',
      data: await this.analyticsService.getRevenueAnalytics(query),
    };
  }

  @Get('traffic')
  @ApiOperation({ summary: 'Get traffic analytics' })
  @ApiResponse({ status: 200, description: 'Traffic analytics retrieved successfully' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiQuery({ name: 'trafficSource', required: false, enum: ['ALL', 'DIRECT', 'ORGANIC', 'PAID', 'SOCIAL', 'REFERRAL', 'EMAIL'] })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getTrafficAnalytics(@Query() query: TrafficAnalyticsDto) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Traffic analytics retrieved successfully',
      data: await this.analyticsService.getTrafficAnalytics(query),
    };
  }

  @Get('conversion')
  @ApiOperation({ summary: 'Get conversion analytics' })
  @ApiResponse({ status: 200, description: 'Conversion analytics retrieved successfully' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiQuery({ name: 'conversionFunnel', required: false, enum: ['PURCHASE', 'SIGNUP', 'CART_ADD', 'CHECKOUT'] })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getConversionAnalytics(@Query() query: ConversionAnalyticsDto) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Conversion analytics retrieved successfully',
      data: await this.analyticsService.getConversionAnalytics(query),
    };
  }

  @Get('user-behavior')
  @ApiOperation({ summary: 'Get user behavior analytics' })
  @ApiResponse({ status: 200, description: 'User behavior analytics retrieved successfully' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiQuery({ name: 'userSegment', required: false, enum: ['ALL', 'NEW', 'RETURNING', 'VIP', 'INACTIVE'] })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getUserBehaviorAnalytics(@Query() query: UserBehaviorAnalyticsDto) {
    return {
      statusCode: HttpStatus.OK,
      message: 'User behavior analytics retrieved successfully',
      data: await this.analyticsService.getUserBehaviorAnalytics(query),
    };
  }

  @Get('product-performance')
  @ApiOperation({ summary: 'Get product performance analytics' })
  @ApiResponse({ status: 200, description: 'Product performance analytics retrieved successfully' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['views', 'sales', 'revenue', 'conversion_rate', 'rating'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getProductPerformanceAnalytics(@Query() query: ProductPerformanceAnalyticsDto) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Product performance analytics retrieved successfully',
      data: await this.analyticsService.getProductPerformanceAnalytics(query),
    };
  }

  @Get('seller-performance')
  @ApiOperation({ summary: 'Get seller performance analytics' })
  @ApiResponse({ status: 200, description: 'Seller performance analytics retrieved successfully' })
  @Roles('ADMIN', 'SUPER_ADMIN', 'SELLER')
  @ApiQuery({ name: 'sortBy', required: false, enum: ['sales', 'revenue', 'products', 'rating', 'response_time'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getSellerPerformanceAnalytics(@Query() query: SellerPerformanceAnalyticsDto) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Seller performance analytics retrieved successfully',
      data: await this.analyticsService.getSellerPerformanceAnalytics(query),
    };
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Get inventory analytics' })
  @ApiResponse({ status: 200, description: 'Inventory analytics retrieved successfully' })
  @Roles('ADMIN', 'SUPER_ADMIN', 'SELLER')
  @ApiQuery({ name: 'stockStatus', required: false, enum: ['ALL', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'] })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getInventoryAnalytics(@Query() query: InventoryAnalyticsDto) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Inventory analytics retrieved successfully',
      data: await this.analyticsService.getInventoryAnalytics(query),
    };
  }

  @Get('marketing')
  @ApiOperation({ summary: 'Get marketing analytics' })
  @ApiResponse({ status: 200, description: 'Marketing analytics retrieved successfully' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiQuery({ name: 'campaignType', required: false, enum: ['ALL', 'EMAIL', 'SOCIAL', 'PAID_SEARCH', 'DISPLAY', 'INFLUENCER'] })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getMarketingAnalytics(@Query() query: MarketingAnalyticsDto) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Marketing analytics retrieved successfully',
      data: await this.analyticsService.getMarketingAnalytics(query),
    };
  }

  @Get('financial')
  @ApiOperation({ summary: 'Get financial analytics' })
  @ApiResponse({ status: 200, description: 'Financial analytics retrieved successfully' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiQuery({ name: 'financialType', required: false, enum: ['ALL', 'REVENUE', 'COSTS', 'PROFIT', 'MARGINS'] })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getFinancialAnalytics(@Query() query: FinancialAnalyticsDto) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Financial analytics retrieved successfully',
      data: await this.analyticsService.getFinancialAnalytics(query),
    };
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard analytics' })
  @ApiResponse({ status: 200, description: 'Dashboard analytics retrieved successfully' })
  @ApiQuery({ name: 'dashboardType', required: false, enum: ['OVERVIEW', 'SALES', 'MARKETING', 'FINANCIAL', 'OPERATIONS'] })
  @ApiQuery({ name: 'timePeriod', required: false, enum: ['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'] })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getDashboardAnalytics(@Query() query: DashboardAnalyticsDto) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Dashboard analytics retrieved successfully',
      data: await this.analyticsService.getDashboardAnalytics(query),
    };
  }

  @Post('export')
  @ApiOperation({ summary: 'Export analytics data' })
  @ApiResponse({ status: 200, description: 'Analytics data exported successfully' })
  @Roles('ADMIN', 'SUPER_ADMIN', 'SELLER')
  @UsePipes(new ValidationPipe({ transform: true }))
  async exportAnalytics(@Body() query: AnalyticsExportDto) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Analytics data exported successfully',
      data: await this.analyticsService.exportAnalytics(query),
    };
  }

  @Get('custom')
  @ApiOperation({ summary: 'Get custom analytics' })
  @ApiResponse({ status: 200, description: 'Custom analytics retrieved successfully' })
  @ApiQuery({ name: 'type', required: false, enum: ['SALES', 'REVENUE', 'TRAFFIC', 'CONVERSION', 'USER_BEHAVIOR', 'PRODUCT_PERFORMANCE', 'SELLER_PERFORMANCE', 'INVENTORY', 'MARKETING', 'FINANCIAL'] })
  @ApiQuery({ name: 'metrics', required: false, type: [String] })
  @ApiQuery({ name: 'dimensions', required: false, type: [String] })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getCustomAnalytics(@Query() query: any) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Custom analytics retrieved successfully',
      data: await this.analyticsService.getCustomAnalytics(query),
    };
  }
}