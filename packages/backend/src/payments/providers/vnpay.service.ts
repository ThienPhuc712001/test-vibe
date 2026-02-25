import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { CreatePaymentDto, RefundPaymentDto } from '../dto/payment.dto';

@Injectable()
export class VNPayService {
  private readonly logger = new Logger(VNPayService.name);
  private readonly tmnCode: string;
  private readonly hashSecret: string;
  private readonly paymentUrl: string;
  private readonly returnUrl: string;

  constructor() {
    this.tmnCode = process.env.VNPAY_TMN_CODE || '';
    this.hashSecret = process.env.VNPAY_HASH_SECRET || '';
    this.paymentUrl = process.env.VNPAY_PAYMENT_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    this.returnUrl = process.env.VNPAY_RETURN_URL || 'http://localhost:3000/payment/vnpay/return';
  }

  createPaymentUrl(paymentData: CreatePaymentDto) {
    try {
      const orderId = paymentData.orderId;
      const amount = Math.round(paymentData.amount * 100); // Convert to VND cents
      const createDate = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
      const expireDate = new Date(Date.now() + 15 * 60 * 1000).toISOString().replace(/[-:T]/g, '').split('.')[0];

      const vnp_Params = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: this.tmnCode,
        vnp_Locale: 'vn',
        vnp_CurrCode: 'VND',
        vnp_TxnRef: orderId,
        vnp_OrderInfo: paymentData.description || `Payment for order ${orderId}`,
        vnp_OrderType: 'other',
        vnp_Amount: amount,
        vnp_ReturnUrl: paymentData.returnUrl || this.returnUrl,
        vnp_IpAddr: '127.0.0.1', // Should get from request
        vnp_CreateDate: createDate,
        vnp_ExpireDate: expireDate,
      };

      // Sort parameters
      const sortedParams = Object.keys(vnp_Params)
        .sort()
        .reduce((result, key) => {
          result[key] = vnp_Params[key];
          return result;
        }, {});

      // Create query string
      const queryString = Object.keys(sortedParams)
        .map(key => `${key}=${encodeURIComponent(sortedParams[key])}`)
        .join('&');

      // Create signature
      const hmac = crypto.createHmac('sha512', this.hashSecret);
      hmac.update(queryString);
      const vnp_SecureHash = hmac.digest('hex');

      const paymentUrl = `${this.paymentUrl}?${queryString}&vnp_SecureHash=${vnp_SecureHash}`;

      return {
        success: true,
        data: {
          paymentUrl,
          orderId,
          amount: paymentData.amount,
          txnRef: orderId,
        },
      };
    } catch (error) {
      this.logger.error('Error creating VNPay payment URL:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  verifyReturn(queryParams: any) {
    try {
      const vnp_SecureHash = queryParams.vnp_SecureHash;
      delete queryParams.vnp_SecureHash;

      // Sort parameters
      const sortedParams = Object.keys(queryParams)
        .filter(key => queryParams[key] !== null && queryParams[key] !== undefined && queryParams[key] !== '')
        .sort()
        .reduce((result, key) => {
          result[key] = queryParams[key];
          return result;
        }, {});

      // Create query string
      const queryString = Object.keys(sortedParams)
        .map(key => `${key}=${encodeURIComponent(sortedParams[key])}`)
        .join('&');

      // Create signature
      const hmac = crypto.createHmac('sha512', this.hashSecret);
      hmac.update(queryString);
      const calculatedHash = hmac.digest('hex');

      const isValid = calculatedHash === vnp_SecureHash;

      if (isValid) {
        const responseCode = queryParams.vnp_ResponseCode;
        const isSuccess = responseCode === '00';

        return {
          success: true,
          data: {
            isValid,
            isSuccess,
            orderId: queryParams.vnp_TxnRef,
            amount: parseInt(queryParams.vnp_Amount) / 100,
            transactionNo: queryParams.vnp_TransactionNo,
            bankCode: queryParams.vnp_BankCode,
            payDate: queryParams.vnp_PayDate,
            responseCode,
            orderInfo: queryParams.vnp_OrderInfo,
          },
        };
      } else {
        return {
          success: false,
          error: 'Invalid signature',
        };
      }
    } catch (error) {
      this.logger.error('Error verifying VNPay return:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async createRefund(refundData: RefundPaymentDto) {
    try {
      // VNPay refund implementation
      const createDate = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
      
      const vnp_Params = {
        vnp_Version: '2.1.0',
        vnp_Command: 'refund',
        vnp_TmnCode: this.tmnCode,
        vnp_TxnRef: refundData.paymentId,
        vnp_OrderInfo: refundData.reason || `Refund for payment ${refundData.paymentId}`,
        vnp_Amount: Math.round(refundData.amount * 100),
        vnp_CreateDate: createDate,
        vnp_TransactionType: '03', // Refund transaction type
        vnp_TransactionNo: '', // Will be filled by VNPay
      };

      // Sort parameters and create signature
      const sortedParams = Object.keys(vnp_Params)
        .sort()
        .reduce((result, key) => {
          result[key] = vnp_Params[key];
          return result;
        }, {});

      const queryString = Object.keys(sortedParams)
        .map(key => `${key}=${encodeURIComponent(sortedParams[key])}`)
        .join('&');

      const hmac = crypto.createHmac('sha512', this.hashSecret);
      hmac.update(queryString);
      const vnp_SecureHash = hmac.digest('hex');

      // Make API call to VNPay refund endpoint
      const refundUrl = 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction';
      
      const response = await fetch(refundUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `${queryString}&vnp_SecureHash=${vnp_SecureHash}`,
      });

      const result = await response.json();

      if (result.vnp_ResponseCode === '00') {
        return {
          success: true,
          data: {
            refundId: result.vnp_TransactionNo,
            paymentId: refundData.paymentId,
            amount: refundData.amount,
            status: 'completed',
            created: createDate,
          },
        };
      } else {
        return {
          success: false,
          error: `Refund failed: ${result.vnp_ResponseCode}`,
        };
      }
    } catch (error) {
      this.logger.error('Error creating VNPay refund:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async queryTransaction(orderId: string) {
    try {
      const createDate = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
      
      const vnp_Params = {
        vnp_Version: '2.1.0',
        vnp_Command: 'querydr',
        vnp_TmnCode: this.tmnCode,
        vnp_TxnRef: orderId,
        vnp_OrderInfo: `Query transaction ${orderId}`,
        vnp_CreateDate: createDate,
      };

      // Sort parameters and create signature
      const sortedParams = Object.keys(vnp_Params)
        .sort()
        .reduce((result, key) => {
          result[key] = vnp_Params[key];
          return result;
        }, {});

      const queryString = Object.keys(sortedParams)
        .map(key => `${key}=${encodeURIComponent(sortedParams[key])}`)
        .join('&');

      const hmac = crypto.createHmac('sha512', this.hashSecret);
      hmac.update(queryString);
      const vnp_SecureHash = hmac.digest('hex');

      // Make API call to VNPay query endpoint
      const queryUrl = 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction';
      
      const response = await fetch(queryUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `${queryString}&vnp_SecureHash=${vnp_SecureHash}`,
      });

      const result = await response.json();

      return {
        success: true,
        data: {
          orderId: result.vnp_TxnRef,
          amount: parseInt(result.vnp_Amount) / 100,
          transactionNo: result.vnp_TransactionNo,
          bankCode: result.vnp_BankCode,
          payDate: result.vnp_PayDate,
          responseCode: result.vnp_ResponseCode,
          orderInfo: result.vnp_OrderInfo,
          transactionStatus: result.vnp_TransactionStatus,
        },
      };
    } catch (error) {
      this.logger.error('Error querying VNPay transaction:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  generateSecureHash(data: any): string {
    const sortedData = Object.keys(data)
      .sort()
      .reduce((result, key) => {
        if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
          result[key] = data[key];
        }
        return result;
      }, {});

    const queryString = Object.keys(sortedData)
      .map(key => `${key}=${encodeURIComponent(sortedData[key])}`)
      .join('&');

    const hmac = crypto.createHmac('sha512', this.hashSecret);
    hmac.update(queryString);
    return hmac.digest('hex');
  }

  verifySecureHash(data: any, receivedHash: string): boolean {
    const calculatedHash = this.generateSecureHash(data);
    return calculatedHash === receivedHash;
  }
}