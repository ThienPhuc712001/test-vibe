import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { CreatePaymentDto, RefundPaymentDto } from '../dto/payment.dto';

@Injectable()
export class MomoService {
  private readonly logger = new Logger(MomoService.name);
  private readonly partnerCode: string;
  private readonly accessKey: string;
  private readonly secretKey: string;
  private readonly apiUrl: string;
  private readonly returnUrl: string;
  private readonly notifyUrl: string;

  constructor() {
    this.partnerCode = process.env.MOMO_PARTNER_CODE || '';
    this.accessKey = process.env.MOMO_ACCESS_KEY || '';
    this.secretKey = process.env.MOMO_SECRET_KEY || '';
    this.apiUrl = process.env.MOMO_API_URL || 'https://test-payment.momo.vn/v2/gateway/api/create';
    this.returnUrl = process.env.MOMO_RETURN_URL || 'http://localhost:3000/payment/momo/return';
    this.notifyUrl = process.env.MOMO_NOTIFY_URL || 'http://localhost:3000/payment/momo/notify';
  }

  async createPayment(paymentData: CreatePaymentDto) {
    try {
      const orderId = paymentData.orderId;
      const requestId = this.generateRequestId();
      const orderInfo = paymentData.description || `Payment for order ${orderId}`;
      const amount = Math.round(paymentData.amount);
      const extraData = this.encodeExtraData({
        orderId,
        paymentMethod: paymentData.paymentMethod,
        metadata: paymentData.metadata,
      });

      const requestBody = {
        partnerCode: this.partnerCode,
        partnerName: 'Marketplace',
        storeId: 'Marketplace Store',
        requestId,
        amount,
        orderId,
        orderInfo,
        redirectUrl: paymentData.returnUrl || this.returnUrl,
        ipnUrl: this.notifyUrl,
        lang: 'vi',
        requestType: 'captureWallet',
        autoCapture: true,
        extraData,
      };

      // Create signature
      const signature = this.createSignature(requestBody);

      const paymentRequest = {
        ...requestBody,
        signature,
      };

      // Make API call to MoMo
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentRequest),
      });

      const result = await response.json();

      if (result.resultCode === 0) {
        return {
          success: true,
          data: {
            payUrl: result.payUrl,
            orderId: result.orderId,
            requestId: result.requestId,
            amount: result.amount,
            deeplink: result.deeplink,
            qrCodeUrl: result.qrCodeUrl,
          },
        };
      } else {
        return {
          success: false,
          error: result.message || 'Payment creation failed',
          errorCode: result.resultCode,
        };
      }
    } catch (error) {
      this.logger.error('Error creating MoMo payment:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async verifyReturn(queryParams: any) {
    try {
      const signature = queryParams.signature;
      delete queryParams.signature;

      // Create signature from returned parameters
      const calculatedSignature = this.createSignature(queryParams);

      const isValid = calculatedSignature === signature;

      if (isValid) {
        const isSuccess = queryParams.resultCode === '0';

        return {
          success: true,
          data: {
            isValid,
            isSuccess,
            orderId: queryParams.orderId,
            requestId: queryParams.requestId,
            amount: parseInt(queryParams.amount),
            orderInfo: queryParams.orderInfo,
            orderType: queryParams.orderType,
            payType: queryParams.payType,
            transId: queryParams.transId,
            resultCode: queryParams.resultCode,
            message: queryParams.message,
            responseTime: queryParams.responseTime,
            extraData: this.decodeExtraData(queryParams.extraData),
          },
        };
      } else {
        return {
          success: false,
          error: 'Invalid signature',
        };
      }
    } catch (error) {
      this.logger.error('Error verifying MoMo return:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async verifyNotify(body: any) {
    try {
      const signature = body.signature;
      delete body.signature;

      // Create signature from notification data
      const calculatedSignature = this.createSignature(body);

      const isValid = calculatedSignature === signature;

      if (isValid) {
        const isSuccess = body.resultCode === '0';

        return {
          success: true,
          data: {
            isValid,
            isSuccess,
            orderId: body.orderId,
            requestId: body.requestId,
            amount: parseInt(body.amount),
            orderInfo: body.orderInfo,
            orderType: body.orderType,
            payType: body.payType,
            transId: body.transId,
            resultCode: body.resultCode,
            message: body.message,
            responseTime: body.responseTime,
            extraData: this.decodeExtraData(body.extraData),
          },
        };
      } else {
        return {
          success: false,
          error: 'Invalid signature',
        };
      }
    } catch (error) {
      this.logger.error('Error verifying MoMo notify:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async createRefund(refundData: RefundPaymentDto) {
    try {
      const requestId = this.generateRequestId();
      const orderId = refundData.paymentId;

      const requestBody = {
        partnerCode: this.partnerCode,
        requestId,
        orderId,
        amount: Math.round(refundData.amount),
        transId: '', // Will be filled by MoMo
        requestType: 'refundMoMoWallet',
        lang: 'vi',
        description: refundData.reason || `Refund for order ${orderId}`,
      };

      // Create signature
      const signature = this.createSignature(requestBody);

      const refundRequest = {
        ...requestBody,
        signature,
      };

      // Make API call to MoMo refund endpoint
      const refundUrl = 'https://test-payment.momo.vn/v2/gateway/api/refund';
      
      const response = await fetch(refundUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(refundRequest),
      });

      const result = await response.json();

      if (result.resultCode === 0) {
        return {
          success: true,
          data: {
            refundId: result.requestId,
            paymentId: refundData.paymentId,
            amount: refundData.amount,
            status: 'completed',
            transId: result.transId,
            created: new Date().toISOString(),
          },
        };
      } else {
        return {
          success: false,
          error: result.message || 'Refund failed',
          errorCode: result.resultCode,
        };
      }
    } catch (error) {
      this.logger.error('Error creating MoMo refund:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async queryTransaction(orderId: string) {
    try {
      const requestId = this.generateRequestId();

      const requestBody = {
        partnerCode: this.partnerCode,
        requestId,
        orderId,
        lang: 'vi',
        requestType: 'transactionStatus',
      };

      // Create signature
      const signature = this.createSignature(requestBody);

      const queryRequest = {
        ...requestBody,
        signature,
      };

      // Make API call to MoMo query endpoint
      const queryUrl = 'https://test-payment.momo.vn/v2/gateway/api/query';
      
      const response = await fetch(queryUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(queryRequest),
      });

      const result = await response.json();

      if (result.resultCode === 0) {
        return {
          success: true,
          data: {
            orderId: result.orderId,
            requestId: result.requestId,
            amount: parseInt(result.amount),
            orderInfo: result.orderInfo,
            orderType: result.orderType,
            payType: result.payType,
            transId: result.transId,
            resultCode: result.resultCode,
            message: result.message,
            responseTime: result.responseTime,
            extraData: this.decodeExtraData(result.extraData),
          },
        };
      } else {
        return {
          success: false,
          error: result.message || 'Query failed',
          errorCode: result.resultCode,
        };
      }
    } catch (error) {
      this.logger.error('Error querying MoMo transaction:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private createSignature(data: any): string {
    // Sort parameters alphabetically
    const sortedData = Object.keys(data)
      .sort()
      .reduce((result, key) => {
        if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
          result[key] = data[key];
        }
        return result;
      }, {});

    // Create query string
    const queryString = Object.keys(sortedData)
      .map(key => `${key}=${encodeURIComponent(sortedData[key])}`)
      .join('&');

    // Create HMAC SHA256 signature
    const hmac = crypto.createHmac('sha256', this.secretKey);
    hmac.update(queryString);
    return hmac.digest('hex');
  }

  private generateRequestId(): string {
    return Date.now().toString() + Math.floor(Math.random() * 1000).toString();
  }

  private encodeExtraData(data: any): string {
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }

  private decodeExtraData(encodedData: string): any {
    try {
      return JSON.parse(Buffer.from(encodedData, 'base64').toString('utf8'));
    } catch (error) {
      this.logger.error('Error decoding extra data:', error);
      return {};
    }
  }
}