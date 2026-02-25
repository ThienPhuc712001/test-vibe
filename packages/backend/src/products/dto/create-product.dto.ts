import { IsString, IsNumber, IsArray, IsOptional, IsEnum, Min, MaxLength } from 'class-validator';
import { ProductCondition, ProductStatus } from '@prisma/client';

export class CreateProductDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  @MaxLength(2000)
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  originalPrice?: number;

  @IsNumber()
  @Min(0)
  stock: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minOrder?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxOrder?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  weight?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  length?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  width?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  height?: number;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsEnum(ProductCondition)
  condition: ProductCondition;

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @IsString()
  categoryId: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsArray()
  @IsOptional()
  variants?: any[];

  @IsString({ each: true })
  @IsOptional()
  specifications?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  shippingOptions?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paymentOptions?: string[];

  @IsOptional()
  isFeatured?: boolean;

  @IsOptional()
  isActive?: boolean;
}