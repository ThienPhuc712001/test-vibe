import { IsString, IsNumber, IsEnum, IsOptional, IsArray, IsBoolean, Min, Max } from 'class-validator';

export enum PaymentMethod {
  STRIPE = 'stripe',
  VNPAY = 'vnpay',
  MOMO = 'momo',
  WALLET = 'wallet',
  COD = 'cod',
  PAYPAL = 'paypal',
  BNPL = 'bnpl',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum Currency {
  USD = 'USD',
  VND = 'VND',
  EUR = 'EUR',
  GBP = 'GBP',
}

export class CreatePaymentDto {
  @IsString()
  orderId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(Currency)
  currency: Currency;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  returnUrl?: string;

  @IsOptional()
  @IsString()
  cancelUrl?: string;

  @IsOptional()
  @IsString()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsArray()
  metadata?: Record<string, any>[];
}

export class ProcessPaymentDto {
  @IsString()
  paymentIntentId: string;

  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @IsOptional()
  @IsString()
  cvv?: string;

  @IsOptional()
  @IsString()
  otp?: string;

  @IsOptional()
  @IsString()
  bankCode?: string;
}

export class RefundPaymentDto {
  @IsString()
  paymentId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  refundId?: string;
}

export class CreateWalletTransactionDto {
  @IsString()
  userId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(['deposit', 'withdraw', 'transfer'])
  type: 'deposit' | 'withdraw' | 'transfer';

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsOptional()
  @IsString()
  recipientId?: string;
}

export class UpdatePaymentSettingsDto {
  @IsOptional()
  @IsBoolean()
  enableStripe?: boolean;

  @IsOptional()
  @IsString()
  stripePublicKey?: string;

  @IsOptional()
  @IsString()
  stripeSecretKey?: string;

  @IsOptional()
  @IsBoolean()
  enableVNPay?: boolean;

  @IsOptional()
  @IsString()
  vnpayTmnCode?: string;

  @IsOptional()
  @IsString()
  vnpayHashSecret?: string;

  @IsOptional()
  @IsString()
  vnpayPaymentUrl?: string;

  @IsOptional()
  @IsBoolean()
  enableMomo?: boolean;

  @IsOptional()
  @IsString()
  momoPartnerCode?: string;

  @IsOptional()
  @IsString()
  momoAccessKey?: string;

  @IsOptional()
  @IsString()
  momoSecretKey?: string;

  @IsOptional()
  @IsBoolean()
  enableCOD?: boolean;

  @IsOptional()
  @IsBoolean()
  enableWallet?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  walletMinimumBalance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  codFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  stripeFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  vnpayFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  momoFee?: number;
}

export class PaymentWebhookDto {
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