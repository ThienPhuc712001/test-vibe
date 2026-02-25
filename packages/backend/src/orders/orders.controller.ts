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
import { OrdersService } from './orders.service';
import { 
  CreateOrderDto, 
  UpdateOrderDto, 
  CancelOrderDto, 
  RefundOrderDto, 
  ReturnOrderDto,
  TrackOrderDto,
  OrderQueryDto,
  OrderAnalyticsDto,
  BulkOrderUpdateDto,
  OrderExportDto
} from './dto/orders.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ResponseInterceptor } from '../common/interceptors/response.interceptor';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createOrder(
    @CurrentUser() user: any,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Order created successfully',
      data: await this.ordersService.createOrder(user.id, createOrderDto),
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'RETURNED'] })
  @ApiQuery({ name: 'paymentStatus', required: false, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED'] })
  @ApiQuery({ name: 'paymentMethod', required: false, enum: ['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'STRIPE', 'VN_PAY', 'MOMO', 'ZALO_PAY', 'BANK_TRANSFER', 'CASH_ON_DELIVERY', 'WALLET', 'BNPL'] })
  @ApiQuery({ name: 'shippingMethod', required: false, enum: ['STANDARD', 'EXPRESS', 'OVERNIGHT', 'SAME_DAY', 'PICKUP'] })
  @ApiQuery({ name: 'customerId', required: false, type: String })
  @ApiQuery({ name: 'sellerId', required: false, type: String })
  @ApiQuery({ name: 'shopId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['createdAt', 'updatedAt', 'total', 'status'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getOrders(@Query() query: OrderQueryDto) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Orders retrieved successfully',
      data: await this.ordersService.getOrders(query),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  async getOrderById(@Param('id') id: string) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Order retrieved successfully',
      data: await this.ordersService.getOrderById(id),
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update order' })
  @ApiResponse({ status: 200, description: 'Order updated successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateOrder(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Order updated successfully',
      data: await this.ordersService.updateOrder(id, updateOrderDto),
    };
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel order' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Order cannot be cancelled' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async cancelOrder(
    @Param('id') id: string,
    @Body() cancelOrderDto: CancelOrderDto,
  ) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Order cancelled successfully',
      data: await this.ordersService.cancelOrder(id, cancelOrderDto),
    };
  }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Process refund for order' })
  @ApiResponse({ status: 200, description: 'Refund processed successfully' })
  @ApiResponse({ status: 400, description: 'Refund cannot be processed' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async refundOrder(
    @Param('id') id: string,
    @Body() refundOrderDto: RefundOrderDto,
  ) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Refund processed successfully',
      data: await this.ordersService.refundOrder(id, refundOrderDto),
    };
  }

  @Post(':id/return')
  @ApiOperation({ summary: 'Process return for order' })
  @ApiResponse({ status: 201, description: 'Return processed successfully' })
  @ApiResponse({ status: 400, description: 'Return cannot be processed' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async returnOrder(
    @Param('id') id: string,
    @Body() returnOrderDto: ReturnOrderDto,
  ) {
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Return processed successfully',
      data: await this.ordersService.returnOrder(id, returnOrderDto),
    };
  }

  @Get(':id/track')
  @ApiOperation({ summary: 'Track order shipment' })
  @ApiResponse({ status: 200, description: 'Order tracking information retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order or shipment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  async trackOrder(@Param('id') id: string) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Order tracking information retrieved successfully',
      data: await this.ordersService.trackOrder(id),
    };
  }

  @Get('analytics/summary')
  @ApiOperation({ summary: 'Get order analytics and statistics' })
  @ApiResponse({ status: 200, description: 'Order analytics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiQuery({ name: 'groupBy', required: false, enum: ['day', 'week', 'month', 'year'] })
  @ApiQuery({ name: 'sellerId', required: false, type: String })
  @ApiQuery({ name: 'shopId', required: false, type: String })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getOrderAnalytics(@Query() query: OrderAnalyticsDto) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Order analytics retrieved successfully',
      data: await this.ordersService.getOrderAnalytics(query),
    };
  }

  @Post('bulk-update')
  @ApiOperation({ summary: 'Bulk update multiple orders' })
  @ApiResponse({ status: 200, description: 'Orders updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async bulkUpdateOrders(@Body() bulkUpdateDto: BulkOrderUpdateDto) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Orders updated successfully',
      data: await this.ordersService.bulkUpdateOrders(bulkUpdateDto),
    };
  }

  @Post('export')
  @ApiOperation({ summary: 'Export orders data' })
  @ApiResponse({ status: 200, description: 'Orders exported successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Roles('ADMIN', 'SUPER_ADMIN', 'SELLER')
  @UsePipes(new ValidationPipe({ transform: true }))
  async exportOrders(@Body() exportDto: OrderExportDto) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Orders exported successfully',
      data: await this.ordersService.exportOrders(exportDto),
    };
  }

  // Customer specific endpoints
  @Get('customer/my-orders')
  @ApiOperation({ summary: 'Get current user orders' })
  @ApiResponse({ status: 200, description: 'User orders retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'RETURNED'] })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getMyOrders(
    @CurrentUser() user: any,
    @Query() query: OrderQueryDto,
  ) {
    const customerQuery = { ...query, customerId: user.id };
    return {
      statusCode: HttpStatus.OK,
      message: 'User orders retrieved successfully',
      data: await this.ordersService.getOrders(customerQuery),
    };
  }

  // Seller specific endpoints
  @Get('seller/orders')
  @ApiOperation({ summary: 'Get seller orders' })
  @ApiResponse({ status: 200, description: 'Seller orders retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'RETURNED'] })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getSellerOrders(
    @CurrentUser() user: any,
    @Query() query: OrderQueryDto,
  ) {
    const sellerQuery = { ...query, sellerId: user.id };
    return {
      statusCode: HttpStatus.OK,
      message: 'Seller orders retrieved successfully',
      data: await this.ordersService.getOrders(sellerQuery),
    };
  }

  @Get('seller/analytics')
  @ApiOperation({ summary: 'Get seller order analytics' })
  @ApiResponse({ status: 200, description: 'Seller analytics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiQuery({ name: 'groupBy', required: false, enum: ['day', 'week', 'month', 'year'] })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getSellerAnalytics(
    @CurrentUser() user: any,
    @Query() query: OrderAnalyticsDto,
  ) {
    const sellerQuery = { ...query, sellerId: user.id };
    return {
      statusCode: HttpStatus.OK,
      message: 'Seller analytics retrieved successfully',
      data: await this.ordersService.getOrderAnalytics(sellerQuery),
    };
  }

  // Shop specific endpoints
  @Get('shop/:shopId/orders')
  @ApiOperation({ summary: 'Get shop orders' })
  @ApiResponse({ status: 200, description: 'Shop orders retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
  @ApiParam({ name: 'shopId', description: 'Shop ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'RETURNED'] })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getShopOrders(
    @Param('shopId') shopId: string,
    @Query() query: OrderQueryDto,
  ) {
    const shopQuery = { ...query, shopId };
    return {
      statusCode: HttpStatus.OK,
      message: 'Shop orders retrieved successfully',
      data: await this.ordersService.getOrders(shopQuery),
    };
  }

  @Get('shop/:shopId/analytics')
  @ApiOperation({ summary: 'Get shop order analytics' })
  @ApiResponse({ status: 200, description: 'Shop analytics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
  @ApiParam({ name: 'shopId', description: 'Shop ID' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiQuery({ name: 'groupBy', required: false, enum: ['day', 'week', 'month', 'year'] })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getShopAnalytics(
    @Param('shopId') shopId: string,
    @Query() query: OrderAnalyticsDto,
  ) {
    const shopQuery = { ...query, shopId };
    return {
      statusCode: HttpStatus.OK,
      message: 'Shop analytics retrieved successfully',
      data: await this.ordersService.getOrderAnalytics(shopQuery),
    };
  }
}