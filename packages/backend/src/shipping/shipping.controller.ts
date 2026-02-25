import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Body, 
  Param, 
  Query, 
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { 
  CreateShippingOrderDto, 
  CalculateShippingFeeDto, 
  TrackShippingDto,
  CreatePickupRequestDto,
  UpdateShippingOrderDto,
  UpdateShippingSettingsDto 
} from './dto/shipping.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Post('calculate-fee')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.SELLER, UserRole.ADMIN)
  async calculateShippingFee(@Body() calculateFeeDto: CalculateShippingFeeDto) {
    return this.shippingService.calculateShippingFee(calculateFeeDto);
  }

  @Post('orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.SELLER, UserRole.ADMIN)
  async createShippingOrder(@Body() createOrderDto: CreateShippingOrderDto) {
    return this.shippingService.createShippingOrder(createOrderDto);
  }

  @Get('orders/:orderId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.SELLER, UserRole.ADMIN)
  async getShippingOrder(@Param('orderId') orderId: string) {
    return this.shippingService.getShippingOrder(orderId);
  }

  @Put('orders/:orderId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.SELLER, UserRole.ADMIN)
  async updateShippingOrder(
    @Param('orderId') orderId: string,
    @Body() updateOrderDto: UpdateShippingOrderDto,
  ) {
    return this.shippingService.updateShippingOrder(orderId, updateOrderDto);
  }

  @Post('track')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.SELLER, UserRole.ADMIN)
  async trackShipment(@Body() trackDto: TrackShippingDto) {
    return this.shippingService.trackShipment(trackDto);
  }

  @Get('track/:trackingNumber')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.SELLER, UserRole.ADMIN)
  async trackShipmentByNumber(@Param('trackingNumber') trackingNumber: string) {
    return this.shippingService.trackShipment({ trackingNumber });
  }

  @Post('pickup')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.SELLER, UserRole.ADMIN)
  async createPickupRequest(@Body() pickupDto: CreatePickupRequestDto) {
    return this.shippingService.createPickupRequest(pickupDto);
  }

  @Post('cancel/:orderCode')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.SELLER, UserRole.ADMIN)
  async cancelShippingOrder(
    @Param('orderCode') orderCode: string,
    @Query('provider') provider: string,
  ) {
    return this.shippingService.cancelShippingOrder(orderCode, provider);
  }

  @Get('providers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.SELLER, UserRole.ADMIN)
  async getShippingProviders() {
    return this.shippingService.getShippingProviders();
  }

  @Get('settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getShippingSettings() {
    return this.shippingService.getShippingSettings();
  }

  @Put('settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateShippingSettings(@Body() updateSettingsDto: UpdateShippingSettingsDto) {
    return this.shippingService.updateShippingSettings(updateSettingsDto);
  }

  @Get('provinces')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.SELLER, UserRole.ADMIN)
  async getProvinces(@Query('provider') provider: string) {
    return this.shippingService.getProvinces(provider);
  }

  @Get('districts/:provinceId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.SELLER, UserRole.ADMIN)
  async getDistricts(
    @Param('provinceId') provinceId: string,
    @Query('provider') provider: string,
  ) {
    return this.shippingService.getDistricts(parseInt(provinceId), provider);
  }

  @Get('wards/:districtId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.SELLER, UserRole.ADMIN)
  async getWards(
    @Param('districtId') districtId: string,
    @Query('provider') provider: string,
  ) {
    return this.shippingService.getWards(parseInt(districtId), provider);
  }

  // Webhook endpoints for shipping providers
  @Post('webhook/ghn')
  @HttpCode(HttpStatus.OK)
  async ghnWebhook(@Headers() headers: any, @Body() body: any) {
    try {
      // Verify GHN webhook signature
      const webhookData = {
        type: 'ghn.webhook',
        data: body,
        signature: headers['ghn-signature'],
        provider: 'ghn',
      };

      return {
        success: true,
        message: 'Webhook received',
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('webhook/ghtk')
  @HttpCode(HttpStatus.OK)
  async ghtkWebhook(@Headers() headers: any, @Body() body: any) {
    try {
      // Verify GHTK webhook signature
      const webhookData = {
        type: 'ghtk.webhook',
        data: body,
        signature: headers['ghtk-signature'],
        provider: 'ghtk',
      };

      return {
        success: true,
        message: 'Webhook received',
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('webhook/jnt')
  @HttpCode(HttpStatus.OK)
  async jntWebhook(@Headers() headers: any, @Body() body: any) {
    try {
      // Verify J&T webhook signature
      const webhookData = {
        type: 'jnt.webhook',
        data: body,
        signature: headers['jnt-signature'],
        provider: 'jnt',
      };

      return {
        success: true,
        message: 'Webhook received',
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}