import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { CreatePaymentDto, ProcessPaymentDto, RefundPaymentDto } from '../dto/payment.dto';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2024-02-29',
    });
  }

  async createPaymentIntent(paymentData: CreatePaymentDto) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(paymentData.amount * 100), // Convert to cents
        currency: paymentData.currency.toLowerCase(),
        metadata: {
          orderId: paymentData.orderId,
          paymentMethod: paymentData.paymentMethod,
          ...paymentData.metadata,
        },
        description: paymentData.description,
        receipt_email: paymentData.customerEmail,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
        },
      };
    } catch (error) {
      this.logger.error('Error creating Stripe payment intent:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async confirmPayment(paymentData: ProcessPaymentDto) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(
        paymentData.paymentIntentId,
        {
          payment_method: paymentData.paymentMethodId,
        },
      );

      return {
        success: true,
        data: {
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency.toUpperCase(),
        },
      };
    } catch (error) {
      this.logger.error('Error confirming Stripe payment:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async retrievePayment(paymentIntentId: string) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        success: true,
        data: {
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency.toUpperCase(),
          metadata: paymentIntent.metadata,
          created: paymentIntent.created,
        },
      };
    } catch (error) {
      this.logger.error('Error retrieving Stripe payment:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async createRefund(refundData: RefundPaymentDto) {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: refundData.paymentId,
        amount: Math.round(refundData.amount * 100), // Convert to cents
        reason: 'requested_by_customer',
        metadata: {
          reason: refundData.reason,
        },
      });

      return {
        success: true,
        data: {
          refundId: refund.id,
          paymentId: refund.payment_intent,
          amount: refund.amount / 100,
          status: refund.status,
          created: refund.created,
        },
      };
    } catch (error) {
      this.logger.error('Error creating Stripe refund:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async createPaymentMethod(paymentMethodData: any) {
    try {
      const paymentMethod = await this.stripe.paymentMethods.create({
        type: paymentMethodData.type,
        card: paymentMethodData.card,
        billing_details: paymentMethodData.billing_details,
      });

      return {
        success: true,
        data: {
          paymentMethodId: paymentMethod.id,
          type: paymentMethod.type,
          card: paymentMethod.card,
        },
      };
    } catch (error) {
      this.logger.error('Error creating Stripe payment method:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async attachPaymentMethod(paymentMethodId: string, customerId: string) {
    try {
      const paymentMethod = await this.stripe.paymentMethods.attach(
        paymentMethodId,
        { customer: customerId },
      );

      return {
        success: true,
        data: {
          paymentMethodId: paymentMethod.id,
          customerId: paymentMethod.customer,
        },
      };
    } catch (error) {
      this.logger.error('Error attaching Stripe payment method:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async createCustomer(customerData: any) {
    try {
      const customer = await this.stripe.customers.create({
        email: customerData.email,
        name: customerData.name,
        phone: customerData.phone,
        metadata: customerData.metadata,
      });

      return {
        success: true,
        data: {
          customerId: customer.id,
          email: customer.email,
          name: customer.name,
        },
      };
    } catch (error) {
      this.logger.error('Error creating Stripe customer:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async handleWebhook(event: Stripe.Event) {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          return this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        case 'payment_intent.payment_failed':
          return this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        case 'payment_intent.canceled':
          return this.handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
        default:
          return {
            success: true,
            message: `Unhandled event type: ${event.type}`,
          };
      }
    } catch (error) {
      this.logger.error('Error handling Stripe webhook:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    this.logger.log(`Payment succeeded: ${paymentIntent.id}`);
    
    // Update order status, send notifications, etc.
    return {
      success: true,
      data: {
        paymentIntentId: paymentIntent.id,
        orderId: paymentIntent.metadata.orderId,
        status: 'succeeded',
        amount: paymentIntent.amount / 100,
      },
    };
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    this.logger.log(`Payment failed: ${paymentIntent.id}`);
    
    // Update order status, send notifications, etc.
    return {
      success: true,
      data: {
        paymentIntentId: paymentIntent.id,
        orderId: paymentIntent.metadata.orderId,
        status: 'failed',
        amount: paymentIntent.amount / 100,
        lastPaymentError: paymentIntent.last_payment_error,
      },
    };
  }

  private async handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
    this.logger.log(`Payment canceled: ${paymentIntent.id}`);
    
    // Update order status, send notifications, etc.
    return {
      success: true,
      data: {
        paymentIntentId: paymentIntent.id,
        orderId: paymentIntent.metadata.orderId,
        status: 'canceled',
        amount: paymentIntent.amount / 100,
      },
    };
  }

  async getPaymentMethods(customerId: string) {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return {
        success: true,
        data: paymentMethods.data.map(pm => ({
          paymentMethodId: pm.id,
          type: pm.type,
          card: {
            brand: pm.card.brand,
            last4: pm.card.last4,
            exp_month: pm.card.exp_month,
            exp_year: pm.card.exp_year,
          },
          created: pm.created,
        })),
      };
    } catch (error) {
      this.logger.error('Error retrieving Stripe payment methods:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async deletePaymentMethod(paymentMethodId: string) {
    try {
      await this.stripe.paymentMethods.detach(paymentMethodId);

      return {
        success: true,
        data: {
          paymentMethodId,
          deleted: true,
        },
      };
    } catch (error) {
      this.logger.error('Error deleting Stripe payment method:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}