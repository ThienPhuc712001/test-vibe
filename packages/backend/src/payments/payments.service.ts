import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StripeService } from './providers/stripe.service';
import { VNPayService } from './providers/vnpay.service';
import { MomoService } from './providers/momo.service';
import { WalletService } from './providers/wallet.service';
import { 
  CreatePaymentDto, 
  ProcessPaymentDto, 
  RefundPaymentDto, 
  PaymentMethod, 
  PaymentStatus,
  UpdatePaymentSettingsDto 
} from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
    private vnpayService: VNPayService,
    private momoService: MomoService,
    private walletService: WalletService,
  ) {}

  async createPayment(paymentData: CreatePaymentDto) {
    try {
      // Create payment record in database
      const payment = await this.prisma.payment.create({
        data: {
          orderId: paymentData.orderId,
          amount: paymentData.amount,
          currency: paymentData.currency,
          paymentMethod: paymentData.paymentMethod,
          status: PaymentStatus.PENDING,
          description: paymentData.description,
          metadata: paymentData.metadata,
        },
      });

      let paymentResult;

      // Process payment based on method
      switch (paymentData.paymentMethod) {
        case PaymentMethod.STRIPE:
          paymentResult = await this.stripeService.createPaymentIntent(paymentData);
          break;
        case PaymentMethod.VNPAY:
          paymentResult = await this.vnpayService.createPaymentUrl(paymentData);
          break;
        case PaymentMethod.MOMO:
          paymentResult = await this.momoService.createPayment(paymentData);
          break;
        case PaymentMethod.WALLET:
          paymentResult = await this.processWalletPayment(paymentData);
          break;
        case PaymentMethod.COD:
          paymentResult = await this.processCODPayment(paymentData);
          break;
        default:
          throw new Error(`Unsupported payment method: ${paymentData.paymentMethod}`);
      }

      if (paymentResult.success) {
        // Update payment record with provider data
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            providerPaymentId: paymentResult.data.paymentIntentId || paymentResult.data.orderId,
            providerData: paymentResult.data,
          },
        });

        return {
          success: true,
          data: {
            paymentId: payment.id,
            ...paymentResult.data,
          },
        };
      } else {
        // Update payment status to failed
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
            errorMessage: paymentResult.error,
          },
        });

        return {
          success: false,
          error: paymentResult.error,
        };
      }
    } catch (error) {
      this.logger.error('Error creating payment:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async processPayment(paymentData: ProcessPaymentDto) {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { providerPaymentId: paymentData.paymentIntentId },
      });

      if (!payment) {
        return {
          success: false,
          error: 'Payment not found',
        };
      }

      let paymentResult;

      switch (payment.paymentMethod) {
        case PaymentMethod.STRIPE:
          paymentResult = await this.stripeService.confirmPayment(paymentData);
          break;
        default:
          return {
            success: false,
            error: 'Payment processing not supported for this method',
          };
      }

      if (paymentResult.success) {
        // Update payment status
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.COMPLETED,
            completedAt: new Date(),
          },
        });

        return {
          success: true,
          data: paymentResult.data,
        };
      } else {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
            errorMessage: paymentResult.error,
          },
        });

        return {
          success: false,
          error: paymentResult.error,
        };
      }
    } catch (error) {
      this.logger.error('Error processing payment:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async refundPayment(refundData: RefundPaymentDto) {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: refundData.paymentId },
      });

      if (!payment) {
        return {
          success: false,
          error: 'Payment not found',
        };
      }

      if (payment.status !== PaymentStatus.COMPLETED) {
        return {
          success: false,
          error: 'Payment must be completed before refund',
        };
      }

      let refundResult;

      switch (payment.paymentMethod) {
        case PaymentMethod.STRIPE:
          refundResult = await this.stripeService.createRefund(refundData);
          break;
        case PaymentMethod.VNPAY:
          refundResult = await this.vnpayService.createRefund(refundData);
          break;
        case PaymentMethod.MOMO:
          refundResult = await this.momoService.createRefund(refundData);
          break;
        case PaymentMethod.WALLET:
          refundResult = await this.processWalletRefund(refundData);
          break;
        default:
          return {
            success: false,
            error: 'Refund not supported for this payment method',
          };
      }

      if (refundResult.success) {
        // Create refund record
        const refund = await this.prisma.refund.create({
          data: {
            paymentId: payment.id,
            amount: refundData.amount,
            reason: refundData.reason,
            providerRefundId: refundResult.data.refundId,
            status: 'completed',
          },
        });

        // Update payment status
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.REFUNDED,
            refundedAt: new Date(),
          },
        });

        return {
          success: true,
          data: {
            refundId: refund.id,
            ...refundResult.data,
          },
        };
      } else {
        return {
          success: false,
          error: refundResult.error,
        };
      }
    } catch (error) {
      this.logger.error('Error refunding payment:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getPayment(paymentId: string) {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          order: true,
          refunds: true,
        },
      });

      if (!payment) {
        return {
          success: false,
          error: 'Payment not found',
        };
      }

      return {
        success: true,
        data: payment,
      };
    } catch (error) {
      this.logger.error('Error getting payment:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getPaymentsByOrder(orderId: string) {
    try {
      const payments = await this.prisma.payment.findMany({
        where: { orderId },
        include: {
          refunds: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        success: true,
        data: payments,
      };
    } catch (error) {
      this.logger.error('Error getting payments by order:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async handleWebhook(provider: string, data: any) {
    try {
      let webhookResult;

      switch (provider) {
        case 'stripe':
          webhookResult = await this.stripeService.handleWebhook(data);
          break;
        case 'vnpay':
          webhookResult = await this.vnpayService.verifyReturn(data);
          break;
        case 'momo':
          webhookResult = await this.momoService.verifyNotify(data);
          break;
        default:
          return {
            success: false,
            error: 'Unsupported webhook provider',
          };
      }

      if (webhookResult.success) {
        // Update payment status based on webhook
        const { orderId, status } = webhookResult.data;
        
        await this.prisma.payment.updateMany({
          where: { 
            providerPaymentId: orderId,
          },
          data: {
            status: status === 'succeeded' || status === '00' ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
            completedAt: status === 'succeeded' || status === '00' ? new Date() : null,
          },
        });

        return {
          success: true,
          data: webhookResult.data,
        };
      } else {
        return {
          success: false,
          error: webhookResult.error,
        };
      }
    } catch (error) {
      this.logger.error('Error handling webhook:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async processWalletPayment(paymentData: CreatePaymentDto) {
    try {
      const walletResult = await this.walletService.createTransaction({
        userId: paymentData.customerId,
        amount: -paymentData.amount,
        type: 'withdraw',
        description: paymentData.description || `Payment for order ${paymentData.orderId}`,
        referenceId: paymentData.orderId,
      });

      return walletResult;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async processCODPayment(paymentData: CreatePaymentDto) {
    try {
      // COD doesn't require immediate payment processing
      return {
        success: true,
        data: {
          paymentId: `cod_${paymentData.orderId}`,
          instructions: 'Pay on delivery',
          amount: paymentData.amount,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async processWalletRefund(refundData: RefundPaymentDto) {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: refundData.paymentId },
      });

      const walletResult = await this.walletService.createTransaction({
        userId: payment.customerId,
        amount: refundData.amount,
        type: 'deposit',
        description: refundData.reason || `Refund for order ${payment.orderId}`,
        referenceId: refundData.paymentId,
      });

      return walletResult;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getPaymentMethods() {
    try {
      const settings = await this.prisma.paymentSettings.findFirst();
      
      const availableMethods = [];
      
      if (settings?.enableStripe) availableMethods.push(PaymentMethod.STRIPE);
      if (settings?.enableVNPay) availableMethods.push(PaymentMethod.VNPAY);
      if (settings?.enableMomo) availableMethods.push(PaymentMethod.MOMO);
      if (settings?.enableWallet) availableMethods.push(PaymentMethod.WALLET);
      if (settings?.enableCOD) availableMethods.push(PaymentMethod.COD);

      return {
        success: true,
        data: availableMethods,
      };
    } catch (error) {
      this.logger.error('Error getting payment methods:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async updatePaymentSettings(settingsData: UpdatePaymentSettingsDto) {
    try {
      const settings = await this.prisma.paymentSettings.upsert({
        where: { id: 1 },
        update: settingsData,
        create: { id: 1, ...settingsData },
      });

      return {
        success: true,
        data: settings,
      };
    } catch (error) {
      this.logger.error('Error updating payment settings:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getPaymentSettings() {
    try {
      const settings = await this.prisma.paymentSettings.findFirst();

      return {
        success: true,
        data: settings || {},
      };
    } catch (error) {
      this.logger.error('Error getting payment settings:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}