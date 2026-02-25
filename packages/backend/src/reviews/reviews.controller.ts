import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  ValidationPipe,
  UsePipes,
  UseInterceptors
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { 
  CreateReviewDto, 
  UpdateReviewDto, 
  ReviewResponseDto,
  ReviewVoteDto,
  ReviewQueryDto,
  ReviewAnalyticsDto,
  BulkReviewUpdateDto,
  ReviewExportDto,
  ReviewModerationDto,
  ReviewSummaryDto
} from './dto/reviews.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ResponseInterceptor } from '../common/interceptors/response.interceptor';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Reviews')
@Controller('reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
@ApiBearerAuth()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new review' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Review already exists' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createReview(
    @CurrentUser() user: any,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Review created successfully',
      data: await this.reviewsService.createReview(user.id, createReviewDto),
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all reviews with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, enum: ['PRODUCT', 'SELLER', 'SHOP', 'DELIVERY'] })
  @ApiQuery({ name: 'targetId', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'orderId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED', 'FLAGGED'] })
  @ApiQuery({ name: 'minRating', required: false, type: Number })
  @ApiQuery({ name: 'maxRating', required: false, type: Number })
  @ApiQuery({ name: 'hasPhotos', required: false, type: Boolean })
  @ApiQuery({ name: 'hasVideos', required: false, type: Boolean })
  @ApiQuery({ name: 'isVerifiedPurchase', required: false, type: Boolean })
  @ApiQuery({ name: 'isRecommended', required: false, type: Boolean })
  @ApiQuery({ name: 'tags', required: false, type: [String] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['createdAt', 'updatedAt', 'rating', 'helpfulCount', 'verified'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getReviews(@Query() query: ReviewQueryDto) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Reviews retrieved successfully',
      data: await this.reviewsService.getReviews(query),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get review by ID' })
  @ApiResponse({ status: 200, description: 'Review retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  async getReviewById(@Param('id') id: string) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Review retrieved successfully',
      data: await this.reviewsService.getReviewById(id),
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update review' })
  @ApiResponse({ status: 200, description: 'Review updated successfully' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateReview(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Review updated successfully',
      data: await this.reviewsService.updateReview(id, user.id, updateReviewDto),
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete review' })
  @ApiResponse({ status: 200, description: 'Review deleted successfully' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @HttpCode(HttpStatus.OK)
  async deleteReview(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Review deleted successfully',
      data: await this.reviewsService.deleteReview(id, user.id),
    };
  }

  @Post(':id/respond')
  @ApiOperation({ summary: 'Respond to review' })
  @ApiResponse({ status: 201, description: 'Response added successfully' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async respondToReview(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() responseDto: ReviewResponseDto,
  ) {
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Response added successfully',
      data: await this.reviewsService.respondToReview(id, user.id, responseDto),
    };
  }

  @Post(':id/vote')
  @ApiOperation({ summary: 'Vote on review' })
  @ApiResponse({ status: 200, description: 'Vote recorded successfully' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async voteOnReview(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() voteDto: ReviewVoteDto,
  ) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Vote recorded successfully',
      data: await this.reviewsService.voteOnReview(id, user.id, voteDto),
    };
  }

  @Get('analytics/summary')
  @ApiOperation({ summary: 'Get review analytics and statistics' })
  @ApiResponse({ status: 200, description: 'Review analytics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiQuery({ name: 'targetId', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, enum: ['PRODUCT', 'SELLER', 'SHOP', 'DELIVERY'] })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiQuery({ name: 'groupBy', required: false, enum: ['day', 'week', 'month', 'year'] })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getReviewAnalytics(@Query() query: ReviewAnalyticsDto) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Review analytics retrieved successfully',
      data: await this.reviewsService.getReviewAnalytics(query),
    };
  }

  @Post('bulk-update')
  @ApiOperation({ summary: 'Bulk update multiple reviews' })
  @ApiResponse({ status: 200, description: 'Reviews updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Roles('ADMIN', 'SUPER_ADMIN', 'SELLER')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async bulkUpdateReviews(@Body() bulkUpdateDto: BulkReviewUpdateDto) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Reviews updated successfully',
      data: await this.reviewsService.bulkUpdateReviews(bulkUpdateDto),
    };
  }

  @Post('moderate')
  @ApiOperation({ summary: 'Moderate review' })
  @ApiResponse({ status: 200, description: 'Review moderated successfully' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async moderateReview(@Body() moderationDto: ReviewModerationDto) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Review moderated successfully',
      data: await this.reviewsService.moderateReview(moderationDto),
    };
  }

  @Post('summary')
  @ApiOperation({ summary: 'Get review summary for target' })
  @ApiResponse({ status: 200, description: 'Review summary retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getReviewSummary(@Body() summaryDto: ReviewSummaryDto) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Review summary retrieved successfully',
      data: await this.reviewsService.getReviewSummary(summaryDto),
    };
  }

  @Post('export')
  @ApiOperation({ summary: 'Export reviews data' })
  @ApiResponse({ status: 200, description: 'Reviews exported successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Roles('ADMIN', 'SUPER_ADMIN', 'SELLER')
  @UsePipes(new ValidationPipe({ transform: true }))
  async exportReviews(@Body() exportDto: ReviewExportDto) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Reviews exported successfully',
      data: await this.reviewsService.exportReviews(exportDto),
    };
  }

  // User specific endpoints
  @Get('user/my-reviews')
  @ApiOperation({ summary: 'Get current user reviews' })
  @ApiResponse({ status: 200, description: 'User reviews retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, enum: ['PRODUCT', 'SELLER', 'SHOP', 'DELIVERY'] })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED', 'FLAGGED'] })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getMyReviews(
    @CurrentUser() user: any,
    @Query() query: ReviewQueryDto,
  ) {
    const userQuery = { ...query, userId: user.id };
    return {
      statusCode: HttpStatus.OK,
      message: 'User reviews retrieved successfully',
      data: await this.reviewsService.getReviews(userQuery),
    };
  }

  // Product specific endpoints
  @Get('product/:productId/reviews')
  @ApiOperation({ summary: 'Get product reviews' })
  @ApiResponse({ status: 200, description: 'Product reviews retrieved successfully' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'minRating', required: false, type: Number })
  @ApiQuery({ name: 'maxRating', required: false, type: Number })
  @ApiQuery({ name: 'hasPhotos', required: false, type: Boolean })
  @ApiQuery({ name: 'isVerifiedPurchase', required: false, type: Boolean })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['createdAt', 'updatedAt', 'rating', 'helpfulCount', 'verified'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getProductReviews(
    @Param('productId') productId: string,
    @Query() query: ReviewQueryDto,
  ) {
    const productQuery = { ...query, type: 'PRODUCT', targetId: productId };
    return {
      statusCode: HttpStatus.OK,
      message: 'Product reviews retrieved successfully',
      data: await this.reviewsService.getReviews(productQuery),
    };
  }

  @Get('product/:productId/summary')
  @ApiOperation({ summary: 'Get product review summary' })
  @ApiResponse({ status: 200, description: 'Product review summary retrieved successfully' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  async getProductReviewSummary(@Param('productId') productId: string) {
    const summaryDto = {
      targetId: productId,
      type: 'PRODUCT',
    };
    return {
      statusCode: HttpStatus.OK,
      message: 'Product review summary retrieved successfully',
      data: await this.reviewsService.getReviewSummary(summaryDto),
    };
  }

  // Seller specific endpoints
  @Get('seller/:sellerId/reviews')
  @ApiOperation({ summary: 'Get seller reviews' })
  @ApiResponse({ status: 200, description: 'Seller reviews retrieved successfully' })
  @ApiParam({ name: 'sellerId', description: 'Seller ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'minRating', required: false, type: Number })
  @ApiQuery({ name: 'maxRating', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['createdAt', 'updatedAt', 'rating', 'helpfulCount', 'verified'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getSellerReviews(
    @Param('sellerId') sellerId: string,
    @Query() query: ReviewQueryDto,
  ) {
    const sellerQuery = { ...query, type: 'SELLER', targetId: sellerId };
    return {
      statusCode: HttpStatus.OK,
      message: 'Seller reviews retrieved successfully',
      data: await this.reviewsService.getReviews(sellerQuery),
    };
  }

  @Get('seller/:sellerId/summary')
  @ApiOperation({ summary: 'Get seller review summary' })
  @ApiResponse({ status: 200, description: 'Seller review summary retrieved successfully' })
  @ApiParam({ name: 'sellerId', description: 'Seller ID' })
  async getSellerReviewSummary(@Param('sellerId') sellerId: string) {
    const summaryDto = {
      targetId: sellerId,
      type: 'SELLER',
    };
    return {
      statusCode: HttpStatus.OK,
      message: 'Seller review summary retrieved successfully',
      data: await this.reviewsService.getReviewSummary(summaryDto),
    };
  }

  // Shop specific endpoints
  @Get('shop/:shopId/reviews')
  @ApiOperation({ summary: 'Get shop reviews' })
  @ApiResponse({ status: 200, description: 'Shop reviews retrieved successfully' })
  @ApiParam({ name: 'shopId', description: 'Shop ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'minRating', required: false, type: Number })
  @ApiQuery({ name: 'maxRating', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['createdAt', 'updatedAt', 'rating', 'helpfulCount', 'verified'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getShopReviews(
    @Param('shopId') shopId: string,
    @Query() query: ReviewQueryDto,
  ) {
    const shopQuery = { ...query, type: 'SHOP', targetId: shopId };
    return {
      statusCode: HttpStatus.OK,
      message: 'Shop reviews retrieved successfully',
      data: await this.reviewsService.getReviews(shopQuery),
    };
  }

  @Get('shop/:shopId/summary')
  @ApiOperation({ summary: 'Get shop review summary' })
  @ApiResponse({ status: 200, description: 'Shop review summary retrieved successfully' })
  @ApiParam({ name: 'shopId', description: 'Shop ID' })
  async getShopReviewSummary(@Param('shopId') shopId: string) {
    const summaryDto = {
      targetId: shopId,
      type: 'SHOP',
    };
    return {
      statusCode: HttpStatus.OK,
      message: 'Shop review summary retrieved successfully',
      data: await this.reviewsService.getReviewSummary(summaryDto),
    };
  }
}