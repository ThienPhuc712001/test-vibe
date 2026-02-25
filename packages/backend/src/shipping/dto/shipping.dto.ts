import { IsString, IsNumber, IsEnum, IsOptional, IsArray, IsBoolean, Min, Max, IsObject } from 'class-validator';

export enum ShippingProvider {
  GHN = 'ghn',
  GHTK = 'ghtk',
  JNT = 'jnt',
  INTERNAL = 'internal',
}

export enum ShippingType {
  STANDARD = 'standard',
  EXPRESS = 'express',
  OVERNIGHT = 'overnight',
  INTERNATIONAL = 'international',
}

export enum ShippingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PICKUP = 'pickup',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
}

export enum PackageType {
  DOCUMENT = 'document',
  PRODUCT = 'product',
  FRAGILE = 'fragile',
  LIQUID = 'liquid',
  ELECTRONICS = 'electronics',
  CLOTHING = 'clothing',
  FOOD = 'food',
}

export class CreateShippingOrderDto {
  @IsString()
  orderId: string;

  @IsString()
  senderName: string;

  @IsString()
  senderPhone: string;

  @IsString()
  senderAddress: string;

  @IsString()
  senderProvince: string;

  @IsString()
  senderDistrict: string;

  @IsString()
  senderWard: string;

  @IsString()
  receiverName: string;

  @IsString()
  receiverPhone: string;

  @IsString()
  receiverAddress: string;

  @IsString()
  receiverProvince: string;

  @IsString()
  receiverDistrict: string;

  @IsString()
  receiverWard: string;

  @IsNumber()
  @Min(0.1)
  weight: number;

  @IsNumber()
  @Min(1)
  @Max(200)
  length: number;

  @IsNumber()
  @Min(1)
  @Max(200)
  width: number;

  @IsNumber()
  @Min(1)
  @Max(200)
  height: number;

  @IsEnum(PackageType)
  packageType: PackageType;

  @IsEnum(ShippingType)
  shippingType: ShippingType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  codAmount?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsArray()
  items?: any[];

  @IsOptional()
  @IsEnum(ShippingProvider)
  preferredProvider?: ShippingProvider;

  @IsOptional()
  @IsString()
  insuranceValue?: string;

  @IsOptional()
  @IsBoolean()
  requireSignature?: boolean;

  @IsOptional()
  @IsBoolean()
  requireInsurance?: boolean;
}

export class CalculateShippingFeeDto {
  @IsString()
  fromProvince: string;

  @IsString()
  fromDistrict: string;

  @IsString()
  toProvince: string;

  @IsString()
  toDistrict: string;

  @IsNumber()
  @Min(0.1)
  weight: number;

  @IsNumber()
  @Min(1)
  @Max(200)
  length: number;

  @IsNumber()
  @Min(1)
  @Max(200)
  width: number;

  @IsNumber()
  @Min(1)
  @Max(200)
  height: number;

  @IsEnum(PackageType)
  packageType: PackageType;

  @IsEnum(ShippingType)
  shippingType: ShippingType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  codAmount?: number;

  @IsOptional()
  @IsEnum(ShippingProvider)
  provider?: ShippingProvider;
}

export class UpdateShippingOrderDto {
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsEnum(ShippingStatus)
  status?: ShippingStatus;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class TrackShippingDto {
  @IsString()
  trackingNumber: string;

  @IsOptional()
  @IsEnum(ShippingProvider)
  provider?: ShippingProvider;
}

export class CreatePickupRequestDto {
  @IsString()
  orderId: string;

  @IsString()
  pickupAddress: string;

  @IsString()
  pickupProvince: string;

  @IsString()
  pickupDistrict: string;

  @IsString()
  pickupWard: string;

  @IsString()
  pickupName: string;

  @IsString()
  pickupPhone: string;

  @IsString()
  pickupDate: string;

  @IsString()
  pickupTime: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsNumber()
  packageCount?: number;

  @IsOptional()
  @IsBoolean()
  requireInsurance?: boolean;

  @IsOptional()
  @IsEnum(ShippingProvider)
  preferredProvider?: ShippingProvider;
}

export class UpdateShippingSettingsDto {
  @IsOptional()
  @IsBoolean()
  enableGHN?: boolean;

  @IsOptional()
  @IsString()
  ghnApiKey?: string;

  @IsOptional()
  @IsString()
  ghnShopId?: string;

  @IsOptional()
  @IsBoolean()
  enableGHTK?: boolean;

  @IsOptional()
  @IsString()
  ghtkApiKey?: string;

  @IsOptional()
  @IsString()
  ghtkShopId?: string;

  @IsOptional()
  @IsBoolean()
  enableJNT?: boolean;

  @IsOptional()
  @IsString()
  jntApiKey?: string;

  @IsOptional()
  @IsString()
  jntUserId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultShippingFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  freeShippingThreshold?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  ghnFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  ghtkFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  jntFee?: number;
}

export class ShippingWebhookDto {
  @IsString()
  type: string;

  @IsString()
  data: string;

  @IsOptional()
  @IsString()
  signature?: string;

  @IsOptional()
  @IsString()
  provider?: string;
}