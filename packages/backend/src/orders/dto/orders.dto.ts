import { IsString, IsNumber, IsEnum, IsArray, IsOptional, IsDate, IsBoolean, Min, Max, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  RETURNED = 'RETURNED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PAYPAL = 'PAYPAL',
  STRIPE = 'STRIPE',
  VN_PAY = 'VN_PAY',
  MOMO = 'MOMO',
  ZALO_PAY = 'ZALO_PAY',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
  WALLET = 'WALLET',
  BNPL = 'BNPL'
}

export enum ShippingMethod {
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
  OVERNIGHT = 'OVERNIGHT',
  SAME_DAY = 'SAME_DAY',
  PICKUP = 'PICKUP'
}

export class OrderItemDto {
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Product variant ID' })
  @IsString()
  variantId: string;

  @ApiProperty({ description: 'Quantity' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Price at time of order' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: 'Discount amount' })
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ description: 'Product snapshot data' })
  @IsObject()
  productSnapshot?: any;
}

export class ShippingAddressDto {
  @ApiProperty({ description: 'Recipient name' })
  @IsString()
  recipientName: string;

  @ApiProperty({ description: 'Phone number' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ description: 'Address line 1' })
  @IsString()
  addressLine1: string;

  @ApiPropertyOptional({ description: 'Address line 2' })
  @IsString()
  addressLine2?: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'State/Province' })
  @IsString()
  state: string;

  @ApiProperty({ description: 'Postal code' })
  @IsString()
  postalCode: string;

  @ApiProperty({ description: 'Country' })
  @IsString()
  country: string;

  @ApiPropertyOptional({ description: 'Address type' })
  @IsEnum(['HOME', 'WORK', 'OTHER'])
  type?: string;

  @ApiPropertyOptional({ description: 'Is default address' })
  @IsBoolean()
  isDefault?: boolean;
}

export class BillingAddressDto {
  @ApiProperty({ description: 'Recipient name' })
  @IsString()
  recipientName: string;

  @ApiProperty({ description: 'Phone number' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ description: 'Address line 1' })
  @IsString()
  addressLine1: string;

  @ApiPropertyOptional({ description: 'Address line 2' })
  @IsString()
  addressLine2?: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'State/Province' })
  @IsString()
  state: string;

  @ApiProperty({ description: 'Postal code' })
  @IsString()
  postalCode: string;

  @ApiProperty({ description: 'Country' })
  @IsString()
  country: string;

  @ApiPropertyOptional({ description: 'Tax ID' })
  @IsString()
  taxId?: string;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'Order items', type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ description: 'Shipping address', type: ShippingAddressDto })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiPropertyOptional({ description: 'Billing address', type: BillingAddressDto })
  @ValidateNested()
  @Type(() => BillingAddressDto)
  billingAddress?: BillingAddressDto;

  @ApiProperty({ description: 'Payment method', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ description: 'Shipping method', enum: ShippingMethod })
  @IsEnum(ShippingMethod)
  shippingMethod?: ShippingMethod;

  @ApiPropertyOptional({ description: 'Coupon code' })
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional({ description: 'Order notes' })
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Estimated delivery date' })
  @IsDate()
  @Type(() => Date)
  estimatedDelivery?: Date;

  @ApiPropertyOptional({ description: 'Gift message' })
  @IsString()
  giftMessage?: string;

  @ApiPropertyOptional({ description: 'Is gift wrapping' })
  @IsBoolean()
  giftWrapping?: boolean;
}

export class UpdateOrderDto {
  @ApiPropertyOptional({ description: 'Order status', enum: OrderStatus })
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ description: 'Payment status', enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ description: 'Shipping address', type: ShippingAddressDto })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress?: ShippingAddressDto;

  @ApiPropertyOptional({ description: 'Billing address', type: BillingAddressDto })
  @ValidateNested()
  @Type(() => BillingAddressDto)
  billingAddress?: BillingAddressDto;

  @ApiPropertyOptional({ description: 'Order notes' })
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Internal notes' })
  @IsString()
  internalNotes?: string;

  @ApiPropertyOptional({ description: 'Estimated delivery date' })
  @IsDate()
  @Type(() => Date)
  estimatedDelivery?: Date;

  @ApiPropertyOptional({ description: 'Actual delivery date' })
  @IsDate()
  @Type(() => Date)
  actualDelivery?: Date;
}

export class CancelOrderDto {
  @ApiProperty({ description: 'Cancellation reason' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Cancellation details' })
  @IsString()
  details?: string;

  @ApiPropertyOptional({ description: 'Refund requested' })
  @IsBoolean()
  refundRequested?: boolean;

  @ApiPropertyOptional({ description: 'Refund amount' })
  @IsNumber()
  @Min(0)
  refundAmount?: number;
}

export class RefundOrderDto {
  @ApiProperty({ description: 'Refund reason' })
  @IsString()
  reason: string;

  @ApiProperty({ description: 'Refund amount' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: 'Refund items' })
  @IsArray()
  @IsString({ each: true })
  items?: string[];

  @ApiPropertyOptional({ description: 'Refund method' })
  @IsEnum(['ORIGINAL', 'WALLET', 'BANK_TRANSFER'])
  refundMethod?: string;

  @ApiPropertyOptional({ description: 'Refund details' })
  @IsString()
  details?: string;
}

export class ReturnOrderDto {
  @ApiProperty({ description: 'Return reason' })
  @IsString()
  reason: string;

  @ApiProperty({ description: 'Return items' })
  @IsArray()
  @IsString({ each: true })
  items: string[];

  @ApiPropertyOptional({ description: 'Return condition' })
  @IsEnum(['NEW', 'USED', 'DAMAGED'])
  condition?: string;

  @ApiPropertyOptional({ description: 'Return photos' })
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @ApiPropertyOptional({ description: 'Return notes' })
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Refund requested' })
  @IsBoolean()
  refundRequested?: boolean;

  @ApiPropertyOptional({ description: 'Exchange requested' })
  @IsBoolean()
  exchangeRequested?: boolean;

  @ApiPropertyOptional({ description: 'Exchange items' })
  @IsArray()
  @IsString({ each: true })
  exchangeItems?: string[];
}

export class TrackOrderDto {
  @ApiProperty({ description: 'Tracking number' })
  @IsString()
  trackingNumber: string;

  @ApiPropertyOptional({ description: 'Carrier' })
  @IsString()
  carrier?: string;

  @ApiPropertyOptional({ description: 'Tracking URL' })
  @IsString()
  trackingUrl?: string;
}

export class OrderQueryDto {
  @ApiPropertyOptional({ description: 'Page number' })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page' })
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Order status', enum: OrderStatus })
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ description: 'Payment status', enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ description: 'Payment method', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Shipping method', enum: ShippingMethod })
  @IsEnum(ShippingMethod)
  shippingMethod?: ShippingMethod;

  @ApiPropertyOptional({ description: 'Customer ID' })
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Seller ID' })
  @IsString()
  sellerId?: string;

  @ApiPropertyOptional({ description: 'Shop ID' })
  @IsString()
  shopId?: string;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date' })
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Sort by' })
  @IsEnum(['createdAt', 'updatedAt', 'total', 'status'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsEnum(['asc', 'desc'])
  sortOrder?: string = 'desc';
}

export class OrderAnalyticsDto {
  @ApiPropertyOptional({ description: 'Start date' })
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date' })
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Group by' })
  @IsEnum(['day', 'week', 'month', 'year'])
  groupBy?: string = 'day';

  @ApiPropertyOptional({ description: 'Seller ID' })
  @IsString()
  sellerId?: string;

  @ApiPropertyOptional({ description: 'Shop ID' })
  @IsString()
  shopId?: string;
}

export class BulkOrderUpdateDto {
  @ApiProperty({ description: 'Order IDs' })
  @IsArray()
  @IsString({ each: true })
  orderIds: string[];

  @ApiProperty({ description: 'Order status', enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiPropertyOptional({ description: 'Update notes' })
  @IsString()
  notes?: string;
}

export class OrderExportDto {
  @ApiPropertyOptional({ description: 'Start date' })
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date' })
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Order status', enum: OrderStatus })
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ description: 'Export format' })
  @IsEnum(['csv', 'excel', 'pdf'])
  format?: string = 'csv';

  @ApiPropertyOptional({ description: 'Include items' })
  @IsBoolean()
  includeItems?: boolean = true;

  @ApiPropertyOptional({ description: 'Include customer info' })
  @IsBoolean()
  includeCustomerInfo?: boolean = true;
}