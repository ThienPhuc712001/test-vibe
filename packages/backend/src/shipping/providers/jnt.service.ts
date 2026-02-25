import { Injectable, Logger } from '@nestjs/common';
import { 
  CreateShippingOrderDto, 
  CalculateShippingFeeDto, 
  TrackShippingDto,
  CreatePickupRequestDto,
  ShippingProvider,
  ShippingStatus 
} from '../dto/shipping.dto';

@Injectable()
export class JNTService {
  private readonly logger = new Logger(JNTService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly userId: string;

  constructor() {
    this.apiUrl = process.env.JNT_API_URL || 'https://api.jnt.co.id:8443/tracing/api';
    this.apiKey = process.env.JNT_API_KEY || '';
    this.userId = process.env.JNT_USER_ID || '';
  }

  async calculateShippingFee(feeData: CalculateShippingFeeDto) {
    try {
      const requestBody = {
        username: this.userId,
        api_key: this.apiKey,
        OL_ORIGIN: feeData.fromDistrict,
        ORIGIN: feeData.fromProvince,
        OL_ORIGIN_DETAIL: feeData.fromAddress,
        OL_DESTINATION: feeData.toDistrict,
        DESTINATION: feeData.toProvince,
        OL_DESTINATION_DETAIL: feeData.toAddress,
        CUST_ID: 'FEE_CALC',
        ORDERID: 'FEE_CALC_' + Date.now(),
        WEIGHT: feeData.weight.toString(),
        QTY: '1',
        GOODS_DESCR: 'Package',
        GOODS_VALUE: '100000',
        GOODS_AMOUNT: '1',
        COLLECTOR_NAME: 'Sender',
        COLLECTOR_TEL: '0123456789',
        COLLECTOR_ADDR: feeData.fromAddress,
        RECEIVER_NAME: 'Receiver',
        RECEIVER_TEL: '0123456789',
        RECEIVER_ADDR: feeData.toAddress,
        PAYMENT: 'COD',
        PICKUP_TYPE: '01',
        PICKUP_TIME: '12:00',
        PICKUP_DATE: new Date().toISOString().split('T')[0],
        ORIGIN_AREA: 'DOMESTIC',
        DESTINATION_AREA: 'DOMESTIC',
        COD: feeData.codAmount || 0,
        INSURANCE: '0',
        ORIGIN_ZIP: '12345',
        DESTINATION_ZIP: '67890',
        ITEM_DESC: 'Package',
        GENDER: '1',
        BIRTHDAY: '1990-01-01',
        TAX_ID: '123456789',
        SERVICE_TYPE: feeData.shippingType === 'express' ? 'EZ' : 'REG',
      };

      const response = await this.makeRequest('/tariff', requestBody);

      if (response.status === 'success') {
        return {
          success: true,
          data: {
            provider: ShippingProvider.JNT,
            fee: response.tariff?.price || 0,
            deliveryTime: response.tariff?.etd || '',
            serviceType: feeData.shippingType,
            mainService: 'jnt',
          },
        };
      } else {
        return {
          success: false,
          error: response.message || 'Failed to calculate shipping fee',
        };
      }
    } catch (error) {
      this.logger.error('Error calculating J&T shipping fee:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async createShippingOrder(orderData: CreateShippingOrderDto) {
    try {
      const requestBody = {
        username: this.userId,
        api_key: this.apiKey,
        OL_ORIGIN: orderData.senderDistrict,
        ORIGIN: orderData.senderProvince,
        OL_ORIGIN_DETAIL: orderData.senderAddress,
        OL_DESTINATION: orderData.receiverDistrict,
        DESTINATION: orderData.receiverProvince,
        OL_DESTINATION_DETAIL: orderData.receiverAddress,
        CUST_ID: orderData.orderId,
        ORDERID: orderData.orderId,
        WEIGHT: orderData.weight.toString(),
        QTY: '1',
        GOODS_DESCR: orderData.description || 'Package',
        GOODS_VALUE: '100000',
        GOODS_AMOUNT: '1',
        COLLECTOR_NAME: orderData.senderName,
        COLLECTOR_TEL: orderData.senderPhone,
        COLLECTOR_ADDR: orderData.senderAddress,
        RECEIVER_NAME: orderData.receiverName,
        RECEIVER_TEL: orderData.receiverPhone,
        RECEIVER_ADDR: orderData.receiverAddress,
        PAYMENT: orderData.codAmount > 0 ? 'COD' : 'NONCOD',
        PICKUP_TYPE: '01',
        PICKUP_TIME: '12:00',
        PICKUP_DATE: new Date().toISOString().split('T')[0],
        ORIGIN_AREA: 'DOMESTIC',
        DESTINATION_AREA: 'DOMESTIC',
        COD: orderData.codAmount || 0,
        INSURANCE: orderData.requireInsurance ? '1' : '0',
        ORIGIN_ZIP: '12345',
        DESTINATION_ZIP: '67890',
        ITEM_DESC: orderData.description || 'Package',
        GENDER: '1',
        BIRTHDAY: '1990-01-01',
        TAX_ID: '123456789',
        SERVICE_TYPE: orderData.shippingType === 'express' ? 'EZ' : 'REG',
        LENGTH: orderData.length.toString(),
        WIDTH: orderData.width.toString(),
        HEIGHT: orderData.height.toString(),
        VOLUME: (orderData.length * orderData.width * orderData.height).toString(),
      };

      const response = await this.makeRequest('/order', requestBody);

      if (response.status === 'success') {
        return {
          success: true,
          data: {
            orderCode: response.detail?.awb || orderData.orderId,
            trackingNumber: response.detail?.awb || orderData.orderId,
            totalFee: response.detail?.price || 0,
            expectedDeliveryTime: response.detail?.etd || '',
            sortOrder: response.detail?.sort_code || '',
          },
        };
      } else {
        return {
          success: false,
          error: response.message || 'Failed to create shipping order',
        };
      }
    } catch (error) {
      this.logger.error('Error creating J&T shipping order:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async trackShipment(trackingData: TrackShippingDto) {
    try {
      const requestBody = {
        username: this.userId,
        api_key: this.apiKey,
        AWB: trackingData.trackingNumber,
      };

      const response = await this.makeRequest('/track', requestBody);

      if (response.status === 'success') {
        return {
          success: true,
          data: {
            trackingNumber: trackingData.trackingNumber,
            status: this.mapJNTStatus(response.detail?.status),
            currentLocation: response.detail?.location || '',
            expectedDeliveryTime: response.detail?.etd || '',
            trackingHistory: response.detail?.history || [],
            orderInfo: response.detail,
          },
        };
      } else {
        return {
          success: false,
          error: response.message || 'Failed to track shipment',
        };
      }
    } catch (error) {
      this.logger.error('Error tracking J&T shipment:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async createPickupRequest(pickupData: CreatePickupRequestDto) {
    try {
      const requestBody = {
        username: this.userId,
        api_key: this.apiKey,
        CUST_ID: pickupData.orderId,
        ORDERID: pickupData.orderId,
        PICKUP_TYPE: '01',
        PICKUP_TIME: pickupData.pickupTime,
        PICKUP_DATE: pickupData.pickupDate,
        PICKUP_ADDR: pickupData.pickupAddress,
        PICKUP_PROVINCE: pickupData.pickupProvince,
        PICKUP_CITY: pickupData.pickupDistrict,
        PICKUP_ZIP: '12345',
        PICKUP_CONTACT: pickupData.pickupName,
        PICKUP_TEL: pickupData.pickupPhone,
        NOTE: pickupData.note || '',
        REQUIRE_INSURANCE: pickupData.requireInsurance ? '1' : '0',
      };

      const response = await this.makeRequest('/pickuporder', requestBody);

      if (response.status === 'success') {
        return {
          success: true,
          data: {
            pickupId: response.detail?.pickup_id || '',
            pickupDate: response.detail?.pickup_date || '',
            pickupAddress: response.detail?.pickup_address || '',
            status: 'pending',
          },
        };
      } else {
        return {
          success: false,
          error: response.message || 'Failed to create pickup request',
        };
      }
    } catch (error) {
      this.logger.error('Error creating J&T pickup request:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async cancelShippingOrder(orderCode: string) {
    try {
      const requestBody = {
        username: this.userId,
        api_key: this.apiKey,
        AWB: orderCode,
        CANCEL_REASON: 'Customer request',
      };

      const response = await this.makeRequest('/cancelorder', requestBody);

      if (response.status === 'success') {
        return {
          success: true,
          data: {
            orderCode,
            status: 'cancelled',
            cancelledAt: new Date().toISOString(),
          },
        };
      } else {
        return {
          success: false,
          error: response.message || 'Failed to cancel shipping order',
        };
      }
    } catch (error) {
      this.logger.error('Error cancelling J&T shipping order:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getServices() {
    try {
      const requestBody = {
        username: this.userId,
        api_key: this.apiKey,
      };

      const response = await this.makeRequest('/service', requestBody);

      if (response.status === 'success') {
        return {
          success: true,
          data: response.services || [],
        };
      } else {
        return {
          success: false,
          error: response.message || 'Failed to get services',
        };
      }
    } catch (error) {
      this.logger.error('Error getting J&T services:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async makeRequest(endpoint: string, data: any) {
    const url = `${this.apiUrl}${endpoint}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return await response.json();
  }

  private mapJNTStatus(jntStatus: string): ShippingStatus {
    const statusMap: Record<string, ShippingStatus> = {
      '0': ShippingStatus.PENDING,
      '1': ShippingStatus.CONFIRMED,
      '2': ShippingStatus.PICKUP,
      '3': ShippingStatus.IN_TRANSIT,
      '4': ShippingStatus.OUT_FOR_DELIVERY,
      '5': ShippingStatus.DELIVERED,
      '6': ShippingStatus.FAILED,
      '7': ShippingStatus.CANCELLED,
      '8': ShippingStatus.RETURNED,
      '9': ShippingStatus.RETURNED,
    };

    return statusMap[jntStatus] || ShippingStatus.PENDING;
  }
}