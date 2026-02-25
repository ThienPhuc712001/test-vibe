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
export class GHNService {
  private readonly logger = new Logger(GHNService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly shopId: string;

  constructor() {
    this.apiUrl = process.env.GHN_API_URL || 'https://dev-online-gateway.ghn.vn/shiip/public-api/v2';
    this.apiKey = process.env.GHN_API_KEY || '';
    this.shopId = process.env.GHN_SHOP_ID || '';
  }

  async calculateShippingFee(feeData: CalculateShippingFeeDto) {
    try {
      const requestBody = {
        from_district_id: await this.getDistrictId(feeData.fromDistrict, feeData.fromProvince),
        to_district_id: await this.getDistrictId(feeData.toDistrict, feeData.toProvince),
        weight: feeData.weight,
        length: feeData.length,
        width: feeData.width,
        height: feeData.height,
        service_type_id: feeData.shippingType === 'express' ? 5 : 2, // Express or Standard
        payment_type_id: 1, // COD
        cod_amount: feeData.codAmount || 0,
        insurance_value: 0,
        coupon: null,
      };

      const response = await this.makeRequest('/shipping-order/fee', requestBody);

      if (response.code === 200) {
        return {
          success: true,
          data: {
            provider: ShippingProvider.GHN,
            fee: response.data.total,
            deliveryTime: response.data.expected_delivery_time,
            serviceType: response.data.service_type,
            mainService: response.data.main_service,
          },
        };
      } else {
        return {
          success: false,
          error: response.message || 'Failed to calculate shipping fee',
        };
      }
    } catch (error) {
      this.logger.error('Error calculating GHN shipping fee:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async createShippingOrder(orderData: CreateShippingOrderDto) {
    try {
      const requestBody = {
        payment_type_id: orderData.codAmount > 0 ? 2 : 1, // COD or Prepaid
        note: orderData.note || '',
        required_note: orderData.note || '',
        return_phone: orderData.senderPhone,
        return_address: orderData.senderAddress,
        return_district_id: await this.getDistrictId(orderData.senderDistrict, orderData.senderProvince),
        return_ward_code: await this.getWardCode(orderData.senderWard, orderData.senderDistrict, orderData.senderProvince),
        client_order_id: orderData.orderId,
        to_name: orderData.receiverName,
        to_phone: orderData.receiverPhone,
        to_address: orderData.receiverAddress,
        to_ward_code: await this.getWardCode(orderData.receiverWard, orderData.receiverDistrict, orderData.receiverProvince),
        to_district_id: await this.getDistrictId(orderData.receiverDistrict, orderData.receiverProvince),
        cod_amount: orderData.codAmount || 0,
        weight: orderData.weight,
        length: orderData.length,
        width: orderData.width,
        height: orderData.height,
        service_type_id: orderData.shippingType === 'express' ? 5 : 2,
        payment_type_id: orderData.codAmount > 0 ? 2 : 1,
        insurance_value: orderData.insuranceValue || 0,
        items: orderData.items || [],
      };

      const response = await this.makeRequest('/shipping-order/create', requestBody);

      if (response.code === 200) {
        return {
          success: true,
          data: {
            orderCode: response.data.order_code,
            trackingNumber: response.data.order_code,
            totalFee: response.data.total_fee,
            expectedDeliveryTime: response.data.expected_delivery_time,
            sortOrder: response.data.sort_code,
          },
        };
      } else {
        return {
          success: false,
          error: response.message || 'Failed to create shipping order',
        };
      }
    } catch (error) {
      this.logger.error('Error creating GHN shipping order:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async trackShipment(trackingData: TrackShippingDto) {
    try {
      const response = await this.makeRequest('/tracking', {
        order_code: trackingData.trackingNumber,
      });

      if (response.code === 200) {
        return {
          success: true,
          data: {
            trackingNumber: trackingData.trackingNumber,
            status: this.mapGHNStatus(response.data.status),
            currentLocation: response.data.current_location,
            expectedDeliveryTime: response.data.expected_delivery_time,
            trackingHistory: response.data.tracking_history,
            orderInfo: response.data.order_info,
          },
        };
      } else {
        return {
          success: false,
          error: response.message || 'Failed to track shipment',
        };
      }
    } catch (error) {
      this.logger.error('Error tracking GHN shipment:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async createPickupRequest(pickupData: CreatePickupRequestDto) {
    try {
      const requestBody = {
        order_codes: [pickupData.orderId], // Should be actual GHN order codes
        pickup_time: `${pickupData.pickupDate} ${pickupData.pickupTime}`,
        note: pickupData.note || '',
        require_insurance: pickupData.requireInsurance || false,
      };

      const response = await this.makeRequest('/pickup/create', requestBody);

      if (response.code === 200) {
        return {
          success: true,
          data: {
            pickupId: response.data.pickup_id,
            pickupDate: response.data.pickup_date,
            pickupAddress: response.data.pickup_address,
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
      this.logger.error('Error creating GHN pickup request:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async cancelShippingOrder(orderCode: string) {
    try {
      const response = await this.makeRequest('/shipping-order/cancel', {
        order_code: orderCode,
      });

      if (response.code === 200) {
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
      this.logger.error('Error cancelling GHN shipping order:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getProvinces() {
    try {
      const response = await this.makeRequest('/master-data/province', {});

      if (response.code === 200) {
        return {
          success: true,
          data: response.data,
        };
      } else {
        return {
          success: false,
          error: response.message || 'Failed to get provinces',
        };
      }
    } catch (error) {
      this.logger.error('Error getting GHN provinces:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getDistricts(provinceId: number) {
    try {
      const response = await this.makeRequest('/master-data/district', {
        province_id: provinceId,
      });

      if (response.code === 200) {
        return {
          success: true,
          data: response.data,
        };
      } else {
        return {
          success: false,
          error: response.message || 'Failed to get districts',
        };
      }
    } catch (error) {
      this.logger.error('Error getting GHN districts:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getWards(districtId: number) {
    try {
      const response = await this.makeRequest('/master-data/ward', {
        district_id: districtId,
      });

      if (response.code === 200) {
        return {
          success: true,
          data: response.data,
        };
      } else {
        return {
          success: false,
          error: response.message || 'Failed to get wards',
        };
      }
    } catch (error) {
      this.logger.error('Error getting GHN wards:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getServices() {
    try {
      const response = await this.makeRequest('/service/all', {});

      if (response.code === 200) {
        return {
          success: true,
          data: response.data,
        };
      } else {
        return {
          success: false,
          error: response.message || 'Failed to get services',
        };
      }
    } catch (error) {
      this.logger.error('Error getting GHN services:', error);
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

  private async getDistrictId(districtName: string, provinceName: string) {
    // This would typically involve a lookup in your database
    // For now, return a mock implementation
    const districts = await this.getDistricts(1); // Mock province ID
    const district = districts.data?.find((d: any) => d.district_name === districtName);
    return district?.district_id || 0;
  }

  private async getWardCode(wardName: string, districtName: string, provinceName: string) {
    // This would typically involve a lookup in your database
    // For now, return a mock implementation
    const wards = await this.getWards(1); // Mock district ID
    const ward = wards.data?.find((w: any) => w.ward_name === wardName);
    return ward?.ward_code || '';
  }

  private mapGHNStatus(ghnStatus: string): ShippingStatus {
    const statusMap: Record<string, ShippingStatus> = {
      'ready_to_pick': ShippingStatus.PENDING,
      'picking': ShippingStatus.PICKUP,
      'delivering': ShippingStatus.IN_TRANSIT,
      'delivered': ShippingStatus.DELIVERED,
      'delivery_fail': ShippingStatus.FAILED,
      'cancel': ShippingStatus.CANCELLED,
      'return': ShippingStatus.RETURNED,
    };

    return statusMap[ghnStatus] || ShippingStatus.PENDING;
  }
}