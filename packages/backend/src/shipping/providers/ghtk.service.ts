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
export class GHTKService {
  private readonly logger = new Logger(GHTKService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly shopId: string;

  constructor() {
    this.apiUrl = process.env.GHTK_API_URL || 'https://services.giaohangtietkhang.vn/api/services';
    this.apiKey = process.env.GHTK_API_KEY || '';
    this.shopId = process.env.GHTK_SHOP_ID || '';
  }

  async calculateShippingFee(feeData: CalculateShippingFeeDto) {
    try {
      const requestBody = {
        products: [{
          name: 'Package',
          weight: feeData.weight,
          quantity: 1,
          price: 100000, // Mock price
        }],
        order: {
          id: 'FEE_CALC',
          pick_name: 'Sender',
          pick_address: feeData.fromDistrict + ', ' + feeData.fromProvince,
          pick_ward: '',
          pick_tel: '',
          pick_money: 0,
          name: 'Receiver',
          address: feeData.toDistrict + ', ' + feeData.toProvince,
          ward: '',
          tel: '',
          email: '',
          is_freeship: false,
          address_id: 0,
          payment_type_id: 2, // COD
          note: '',
        },
      };

      const response = await this.makeRequest('/public/ShippingFee', requestBody);

      if (response.success) {
        return {
          success: true,
          data: {
            provider: ShippingProvider.GHTK,
            fee: response.fee?.fee || 0,
            deliveryTime: response.fee?.deliver_time || '',
            serviceType: 'standard',
            mainService: 'ghtk',
          },
        };
      } else {
        return {
          success: false,
          error: response.message || 'Failed to calculate shipping fee',
        };
      }
    } catch (error) {
      this.logger.error('Error calculating GHTK shipping fee:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async createShippingOrder(orderData: CreateShippingOrderDto) {
    try {
      const requestBody = {
        products: orderData.items || [{
          name: 'Package',
          weight: orderData.weight,
          quantity: 1,
          price: 100000, // Mock price
        }],
        order: {
          id: orderData.orderId,
          pick_name: orderData.senderName,
          pick_address: orderData.senderAddress + ', ' + orderData.senderDistrict + ', ' + orderData.senderProvince,
          pick_ward: orderData.senderWard,
          pick_tel: orderData.senderPhone,
          pick_money: 0,
          name: orderData.receiverName,
          address: orderData.receiverAddress + ', ' + orderData.receiverDistrict + ', ' + orderData.receiverProvince,
          ward: orderData.receiverWard,
          tel: orderData.receiverPhone,
          email: '',
          is_freeship: false,
          address_id: 0,
          payment_type_id: orderData.codAmount > 0 ? 2 : 1, // COD or Prepaid
          note: orderData.note || '',
        },
      };

      const response = await this.makeRequest('/public/Order', requestBody);

      if (response.success) {
        return {
          success: true,
          data: {
            orderCode: response.order?.label_id || orderData.orderId,
            trackingNumber: response.order?.tracking_number || orderData.orderId,
            totalFee: response.order?.fee || 0,
            expectedDeliveryTime: response.order?.deliver_time || '',
            sortOrder: response.order?.sort_code || '',
          },
        };
      } else {
        return {
          success: false,
          error: response.message || 'Failed to create shipping order',
        };
      }
    } catch (error) {
      this.logger.error('Error creating GHTK shipping order:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async trackShipment(trackingData: TrackShippingDto) {
    try {
      const response = await this.makeRequest('/public/TrackingOrder', {
        code: trackingData.trackingNumber,
      });

      if (response.success) {
        return {
          success: true,
          data: {
            trackingNumber: trackingData.trackingNumber,
            status: this.mapGHTKStatus(response.order?.status),
            currentLocation: response.order?.current_location || '',
            expectedDeliveryTime: response.order?.deliver_time || '',
            trackingHistory: response.order?.tracking_history || [],
            orderInfo: response.order,
          },
        };
      } else {
        return {
          success: false,
          error: response.message || 'Failed to track shipment',
        };
      }
    } catch (error) {
      this.logger.error('Error tracking GHTK shipment:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async createPickupRequest(pickupData: CreatePickupRequestDto) {
    try {
      const requestBody = {
        order_info: {
          id: pickupData.orderId,
          pick_name: pickupData.pickupName,
          pick_address: pickupData.pickupAddress,
          pick_ward: '',
          pick_tel: pickupData.pickupPhone,
          pick_money: 0,
          note: pickupData.note || '',
          pick_date: pickupData.pickupDate,
          pick_time: pickupData.pickupTime,
          require_insurance: pickupData.requireInsurance || false,
        },
      };

      const response = await this.makeRequest('/public/Pickup', requestBody);

      if (response.success) {
        return {
          success: true,
          data: {
            pickupId: response.pickup?.id || '',
            pickupDate: response.pickup?.date || '',
            pickupAddress: response.pickup?.address || '',
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
      this.logger.error('Error creating GHTK pickup request:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async cancelShippingOrder(orderCode: string) {
    try {
      const response = await this.makeRequest('/public/CancelOrder', {
        code: orderCode,
      });

      if (response.success) {
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
      this.logger.error('Error cancelling GHTK shipping order:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getProvinces() {
    try {
      const response = await this.makeRequest('/public/Province', {});

      if (response.success) {
        return {
          success: true,
          data: response.provinces || [],
        };
      } else {
        return {
          success: false,
          error: response.message || 'Failed to get provinces',
        };
      }
    } catch (error) {
      this.logger.error('Error getting GHTK provinces:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getDistricts(provinceId: number) {
    try {
      const response = await this.makeRequest('/public/District', {
        ProvinceID: provinceId,
      });

      if (response.success) {
        return {
          success: true,
          data: response.districts || [],
        };
      } else {
        return {
          success: false,
          error: response.message || 'Failed to get districts',
        };
      }
    } catch (error) {
      this.logger.error('Error getting GHTK districts:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getWards(districtId: number) {
    try {
      const response = await this.makeRequest('/public/Ward', {
        DistrictID: districtId,
      });

      if (response.success) {
        return {
          success: true,
          data: response.wards || [],
        };
      } else {
        return {
          success: false,
          error: response.message || 'Failed to get wards',
        };
      }
    } catch (error) {
      this.logger.error('Error getting GHTK wards:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getServices() {
    try {
      const response = await this.makeRequest('/public/Service', {});

      if (response.success) {
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
      this.logger.error('Error getting GHTK services:', error);
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
        'Token': this.apiKey,
        'ShopId': this.shopId,
      },
      body: JSON.stringify(data),
    });

    return await response.json();
  }

  private mapGHTKStatus(ghtkStatus: string): ShippingStatus {
    const statusMap: Record<string, ShippingStatus> = {
      '-1': ShippingStatus.PENDING,
      '1': ShippingStatus.CONFIRMED,
      '2': ShippingStatus.PICKUP,
      '3': ShippingStatus.IN_TRANSIT,
      '4': ShippingStatus.OUT_FOR_DELIVERY,
      '5': ShippingStatus.DELIVERED,
      '6': ShippingStatus.FAILED,
      '7': ShippingStatus.CANCELLED,
      '8': ShippingStatus.RETURNED,
    };

    return statusMap[ghtkStatus] || ShippingStatus.PENDING;
  }
}