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
import { PaymentsService } from './payments.service';
import { 
  CreatePaymentDto, 
  ProcessPaymentDto, 
  RefundPaymentDto, 
  PaymentWebhookDto,
  UpdatePaymentSettingsDto 
} from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.SELLER)
  async createPayment(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.createPayment(createPaymentDto);
  }

  @Post('process')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.SELLER)
  async processPayment(@Body() processPaymentDto: ProcessPaymentDto) {
    return this.paymentsService.processPayment(processPaymentDto);
  }

  @Post('refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.SELLER, UserRole.ADMIN)
  async refundPayment(@Body() refundPaymentDto: RefundPaymentDto) {
    return this.paymentsService.refundPayment(refundPaymentDto);
  }

  @Get(':paymentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.SELLER, UserRole.ADMIN)
  async getPayment(@Param('paymentId') paymentId: string) {
    return this.paymentsService.getPayment(paymentId);
  }

  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.SELLER, UserRole.ADMIN)
  async getPaymentsByOrder(@Param('orderId') orderId: string) {
    return this.paymentsService.getPaymentsByOrder(orderId);
  }

  @Get('methods')
  async getPaymentMethods() {
    return this.paymentsService.getPaymentMethods();
  }

  @Get('settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getPaymentSettings() {
    return this.paymentsService.getPaymentSettings();
  }

  @Put('settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updatePaymentSettings(@Body() updatePaymentSettingsDto: UpdatePaymentSettingsDto) {
    return this.paymentsService.updatePaymentSettings(updatePaymentSettingsDto);
  }

  // Webhook endpoints
  @Post('webhook/stripe')
  @HttpCode(HttpStatus.OK)
  async stripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Body() body: any,
  ) {
    try {
      // Verify Stripe webhook signature
      const webhookData = {
        type: 'stripe.webhook',
        data: body,
        signature,
        provider: 'stripe',
      };

      return this.paymentsService.handleWebhook('stripe', webhookData);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('webhook/vnpay/return')
  async vnpayReturn(@Query() query: any) {
    try {
      const webhookData = {
        type: 'vnpay.return',
        data: query,
        provider: 'vnpay',
      };

      return this.paymentsService.handleWebhook('vnpay', webhookData);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('webhook/vnpay/notify')
  @HttpCode(HttpStatus.OK)
  async vnpayNotify(@Body() body: any) {
    try {
      const webhookData = {
        type: 'vnpay.notify',
        data: body,
        provider: 'vnpay',
      };

      return this.paymentsService.handleWebhook('vnpay', webhookData);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('webhook/momo/return')
  async momoReturn(@Query() query: any) {
    try {
      const webhookData = {
        type: 'momo.return',
        data: query,
        provider: 'momo',
      };

      return this.paymentsService.handleWebhook('momo', webhookData);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('webhook/momo/notify')
  @HttpCode(HttpStatus.OK)
  async momoNotify(@Body() body: any) {
    try {
      const webhookData = {
        type: 'momo.notify',
        data: body,
        provider: 'momo',
      };

      return this.paymentsService.handleWebhook('momo', webhookData);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}