import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { GHNService } from './providers/ghn.service';
import { GHTKService } from './providers/ghtk.service';
import { JNTService } from './providers/jnt.service';
import { 
  CreateShippingOrderDto, 
  CalculateShippingFeeDto, 
  TrackShippingDto,
  CreatePickupRequestDto,
  UpdateShippingOrderDto,
  ShippingProvider,
  ShippingStatus,
  UpdateShippingSettingsDto 
} from './dto/shipping.dto';

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);

  constructor(
    private prisma: PrismaService,
    private ghnService: GHNService,
    private ghtkService: GHTKService,
    private jntService: JNTService,
  ) {}

  async calculateShippingFee(feeData: CalculateShippingFeeDto) {
    try {
      let result;

      // Use preferred provider if specified, otherwise try all and return cheapest
      if (feeData.provider) {
        switch (feeData.provider) {
          case ShippingProvider.GHN:
            result = await this.ghnService.calculateShippingFee(feeData);
            break;
          case ShippingProvider.GHTK:
            result = await this.ghtkService.calculateShippingFee(feeData);
            break;
          case ShippingProvider.JNT:
            result = await this.jntService.calculateShippingFee(feeData);
            break;
          default:
            return {
              success: false,
              error: 'Unsupported shipping provider',
            };
        }
      } else {
        // Get quotes from all providers and return the cheapest
        const quotes = await Promise.all([
          this.ghnService.calculateShippingFee(feeData),
          this.ghtkService.calculateShippingFee(feeData),
          this.jntService.calculateShippingFee(feeData),
        ]);

        const validQuotes = quotes.filter(q => q.success);
        
        if (validQuotes.length === 0) {
          return {
            success: false,
            error: 'No shipping quotes available',
          };
        }

        // Find the cheapest quote
        const cheapestQuote = validQuotes.reduce((cheapest, current) => 
          current.data.fee < cheapest.data.fee ? current : cheapest
        );

        result = cheapestQuote;
      }

      // Save shipping quote to database
      if (result.success) {
        await this.prisma.shippingQuote.create({
          data: {
            fromProvince: feeData.fromProvince,
            fromDistrict: feeData.fromDistrict,
            toProvince: feeData.toProvince,
            toDistrict: feeData.toDistrict,
            weight: feeData.weight,
            length: feeData.length,
            width: feeData.width,
            height: feeData.height,
            packageType: feeData.packageType,
            shippingType: feeData.shippingType,
            codAmount: feeData.codAmount,
            provider: result.data.provider,
            fee: result.data.fee,
            deliveryTime: result.data.deliveryTime,
            serviceType: result.data.serviceType,
          },
        });
      }

      return result;
    } catch (error) {
      this.logger.error('Error calculating shipping fee:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async createShippingOrder(orderData: CreateShippingOrderDto) {
    try {
      // Determine the best provider based on availability and cost
      const feeData = {
        fromProvince: orderData.senderProvince,
        fromDistrict: orderData.senderDistrict,
        toProvince: orderData.receiverProvince,
        toDistrict: orderData.receiverDistrict,
        weight: orderData.weight,
        length: orderData.length,
        width: orderData.width,
        height: orderData.height,
        packageType: orderData.packageType,
        shippingType: orderData.shippingType,
        codAmount: orderData.codAmount,
        provider: orderData.preferredProvider,
      };

      const feeResult = await this.calculateShippingFee(feeData);
      
      if (!feeResult.success) {
        return feeResult;
      }

      // Create shipping order with the selected provider
      let orderResult;
      const selectedProvider = feeResult.data.provider;

      switch (selectedProvider) {
        case ShippingProvider.GHN:
          orderResult = await this.ghnService.createShippingOrder(orderData);
          break;
        case ShippingProvider.GHTK:
          orderResult = await this.ghtkService.createShippingOrder(orderData);
          break;
        case ShippingProvider.JNT:
          orderResult = await this.jntService.createShippingOrder(orderData);
          break;
        default:
          return {
            success: false,
            error: 'Unsupported shipping provider',
          };
      }

      if (orderResult.success) {
        // Save shipping order to database
        const shippingOrder = await this.prisma.shippingOrder.create({
          data: {
            orderId: orderData.orderId,
            provider: selectedProvider,
            trackingNumber: orderResult.data.trackingNumber,
            status: ShippingStatus.PENDING,
            senderName: orderData.senderName,
            senderPhone: orderData.senderPhone,
            senderAddress: orderData.senderAddress,
            senderProvince: orderData.senderProvince,
            senderDistrict: orderData.senderDistrict,
            senderWard: orderData.senderWard,
            receiverName: orderData.receiverName,
            receiverPhone: orderData.receiverPhone,
            receiverAddress: orderData.receiverAddress,
            receiverProvince: orderData.receiverProvince,
            receiverDistrict: orderData.receiverDistrict,
            receiverWard: orderData.receiverWard,
            weight: orderData.weight,
            length: orderData.length,
            width: orderData.width,
            height: orderData.height,
            packageType: orderData.packageType,
            shippingType: orderData.shippingType,
            codAmount: orderData.codAmount,
            fee: orderResult.data.totalFee,
            expectedDeliveryTime: orderResult.data.expectedDeliveryTime,
            description: orderData.description,
            note: orderData.note,
            requireSignature: orderData.requireSignature,
            requireInsurance: orderData.requireInsurance,
            insuranceValue: orderData.insuranceValue,
            providerData: orderResult.data,
          },
        });

        return {
          success: true,
          data: {
            shippingOrderId: shippingOrder.id,
            trackingNumber: orderResult.data.trackingNumber,
            provider: selectedProvider,
            fee: orderResult.data.totalFee,
            expectedDeliveryTime: orderResult.data.expectedDeliveryTime,
            status: ShippingStatus.PENDING,
          },
        };
      }

      return orderResult;
    } catch (error) {
      this.logger.error('Error creating shipping order:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async trackShipment(trackingData: TrackShippingDto) {
    try {
      // Try to determine provider from tracking number format or use specified provider
      let result;

      if (trackingData.provider) {
        switch (trackingData.provider) {
          case ShippingProvider.GHN:
            result = await this.ghnService.trackShipment(trackingData);
            break;
          case ShippingProvider.GHTK:
            result = await this.ghtkService.trackShipment(trackingData);
            break;
          case ShippingProvider.JNT:
            result = await this.jntService.trackShipment(trackingData);
            break;
          default:
            return {
              success: false,
              error: 'Unsupported shipping provider',
            };
        }
      } else {
        // Try all providers until one returns a result
        const providers = [ShippingProvider.GHN, ShippingProvider.GHTK, ShippingProvider.JNT];
        
        for (const provider of providers) {
          result = await this.trackShipmentWithProvider(provider, trackingData);
          if (result.success) {
            break;
          }
        }
      }

      // Update tracking in database if successful
      if (result.success) {
        await this.prisma.shippingTracking.create({
          data: {
            trackingNumber: trackingData.trackingNumber,
            provider: result.data.provider || trackingData.provider,
            status: result.data.status,
            currentLocation: result.data.currentLocation,
            expectedDeliveryTime: result.data.expectedDeliveryTime,
            trackingHistory: result.data.trackingHistory,
            orderInfo: result.data.orderInfo,
          },
        });
      }

      return result;
    } catch (error) {
      this.logger.error('Error tracking shipment:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async trackShipmentWithProvider(provider: ShippingProvider, trackingData: TrackShippingDto) {
    switch (provider) {
      case ShippingProvider.GHN:
        return await this.ghnService.trackShipment(trackingData);
      case ShippingProvider.GHTK:
        return await this.ghtkService.trackShipment(trackingData);
      case ShippingProvider.JNT:
        return await this.jntService.trackShipment(trackingData);
      default:
        return {
          success: false,
          error: 'Unsupported shipping provider',
        };
    }
  }

  async createPickupRequest(pickupData: CreatePickupRequestDto) {
    try {
      let result;

      if (pickupData.preferredProvider) {
        switch (pickupData.preferredProvider) {
          case ShippingProvider.GHN:
            result = await this.ghnService.createPickupRequest(pickupData);
            break;
          case ShippingProvider.GHTK:
            result = await this.ghtkService.createPickupRequest(pickupData);
            break;
          case ShippingProvider.JNT:
            result = await this.jntService.createPickupRequest(pickupData);
            break;
          default:
            return {
              success: false,
              error: 'Unsupported shipping provider',
            };
        }
      } else {
        // Try GHN first, then GHTK, then JNT
        const providers = [ShippingProvider.GHN, ShippingProvider.GHTK, ShippingProvider.JNT];
        
        for (const provider of providers) {
          result = await this.createPickupWithProvider(provider, pickupData);
          if (result.success) {
            break;
          }
        }
      }

      if (result.success) {
        // Save pickup request to database
        await this.prisma.pickupRequest.create({
          data: {
            orderId: pickupData.orderId,
            provider: result.data.provider || pickupData.preferredProvider,
            pickupAddress: pickupData.pickupAddress,
            pickupProvince: pickupData.pickupProvince,
            pickupDistrict: pickupData.pickupDistrict,
            pickupWard: pickupData.pickupWard,
            pickupName: pickupData.pickupName,
            pickupPhone: pickupData.pickupPhone,
            pickupDate: pickupData.pickupDate,
            pickupTime: pickupData.pickupTime,
            note: pickupData.note,
            packageCount: pickupData.packageCount,
            requireInsurance: pickupData.requireInsurance,
            status: 'pending',
            providerData: result.data,
          },
        });
      }

      return result;
    } catch (error) {
      this.logger.error('Error creating pickup request:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async createPickupWithProvider(provider: ShippingProvider, pickupData: CreatePickupRequestDto) {
    switch (provider) {
      case ShippingProvider.GHN:
        return await this.ghnService.createPickupRequest(pickupData);
      case ShippingProvider.GHTK:
        return await this.ghtkService.createPickupRequest(pickupData);
      case ShippingProvider.JNT:
        return await this.jntService.createPickupRequest(pickupData);
      default:
        return {
          success: false,
          error: 'Unsupported shipping provider',
        };
    }
  }

  async cancelShippingOrder(orderCode: string, provider: ShippingProvider) {
    try {
      let result;

      switch (provider) {
        case ShippingProvider.GHN:
          result = await this.ghnService.cancelShippingOrder(orderCode);
          break;
        case ShippingProvider.GHTK:
          result = await this.ghtkService.cancelShippingOrder(orderCode);
          break;
        case ShippingProvider.JNT:
          result = await this.jntService.cancelShippingOrder(orderCode);
          break;
        default:
          return {
            success: false,
            error: 'Unsupported shipping provider',
          };
      }

      if (result.success) {
        // Update shipping order status in database
        await this.prisma.shippingOrder.updateMany({
          where: { trackingNumber: orderCode },
          data: {
            status: ShippingStatus.CANCELLED,
            cancelledAt: new Date(),
          },
        });
      }

      return result;
    } catch (error) {
      this.logger.error('Error cancelling shipping order:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getShippingOrder(orderId: string) {
    try {
      const shippingOrder = await this.prisma.shippingOrder.findUnique({
        where: { orderId },
        include: {
          tracking: true,
          pickup: true,
        },
      });

      if (!shippingOrder) {
        return {
          success: false,
          error: 'Shipping order not found',
        };
      }

      return {
        success: true,
        data: shippingOrder,
      };
    } catch (error) {
      this.logger.error('Error getting shipping order:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async updateShippingOrder(orderId: string, updateData: UpdateShippingOrderDto) {
    try {
      const shippingOrder = await this.prisma.shippingOrder.update({
        where: { orderId },
        data: {
          status: updateData.status,
          trackingNumber: updateData.trackingNumber,
          note: updateData.note,
          metadata: updateData.metadata,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        data: shippingOrder,
      };
    } catch (error) {
      this.logger.error('Error updating shipping order:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getShippingProviders() {
    try {
      const settings = await this.prisma.shippingSettings.findFirst();
      
      const providers = [];
      
      if (settings?.enableGHN) providers.push(ShippingProvider.GHN);
      if (settings?.enableGHTK) providers.push(ShippingProvider.GHTK);
      if (settings?.enableJNT) providers.push(ShippingProvider.JNT);

      return {
        success: true,
        data: providers,
      };
    } catch (error) {
      this.logger.error('Error getting shipping providers:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async updateShippingSettings(settingsData: UpdateShippingSettingsDto) {
    try {
      const settings = await this.prisma.shippingSettings.upsert({
        where: { id: 1 },
        update: settingsData,
        create: { id: 1, ...settingsData },
      });

      return {
        success: true,
        data: settings,
      };
    } catch (error) {
      this.logger.error('Error updating shipping settings:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getShippingSettings() {
    try {
      const settings = await this.prisma.shippingSettings.findFirst();

      return {
        success: true,
        data: settings || {},
      };
    } catch (error) {
      this.logger.error('Error getting shipping settings:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getProvinces(provider?: ShippingProvider) {
    try {
      let result;

      if (provider) {
        switch (provider) {
          case ShippingProvider.GHN:
            result = await this.ghnService.getProvinces();
            break;
          case ShippingProvider.GHTK:
            result = await this.ghtkService.getProvinces();
            break;
          default:
            return {
              success: false,
              error: 'Unsupported shipping provider',
            };
        }
      } else {
        // Try GHN first
        result = await this.ghnService.getProvinces();
      }

      return result;
    } catch (error) {
      this.logger.error('Error getting provinces:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getDistricts(provinceId: number, provider?: ShippingProvider) {
    try {
      let result;

      if (provider) {
        switch (provider) {
          case ShippingProvider.GHN:
            result = await this.ghnService.getDistricts(provinceId);
            break;
          case ShippingProvider.GHTK:
            result = await this.ghtkService.getDistricts(provinceId);
            break;
          default:
            return {
              success: false,
              error: 'Unsupported shipping provider',
            };
        }
      } else {
        // Try GHN first
        result = await this.ghnService.getDistricts(provinceId);
      }

      return result;
    } catch (error) {
      this.logger.error('Error getting districts:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getWards(districtId: number, provider?: ShippingProvider) {
    try {
      let result;

      if (provider) {
        switch (provider) {
          case ShippingProvider.GHN:
            result = await this.ghnService.getWards(districtId);
            break;
          case ShippingProvider.GHTK:
            result = await this.ghtkService.getWards(districtId);
            break;
          default:
            return {
              success: false,
              error: 'Unsupported shipping provider',
            };
        }
      } else {
        // Try GHN first
        result = await this.ghnService.getWards(districtId);
      }

      return result;
    } catch (error) {
      this.logger.error('Error getting wards:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}