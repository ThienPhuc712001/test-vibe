import { IsString, IsOptional, IsNumber, IsEnum, IsArray, IsObject, Min, Max } from 'class-validator';

export enum SearchType {
  PRODUCTS = 'products',
  SHOPS = 'shops',
  CATEGORIES = 'categories',
  BRANDS = 'brands',
  USERS = 'users',
  ORDERS = 'orders',
  ALL = 'all',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum SortField {
  RELEVANCE = 'relevance',
  PRICE = 'price',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  RATING = 'rating',
  SALES_COUNT = 'salesCount',
  NAME = 'name',
  POPULARITY = 'popularity',
}

export class SearchQueryDto {
  @IsString()
  query: string;

  @IsEnum(SearchType)
  @IsOptional()
  type?: SearchType = SearchType.ALL;

  @IsArray()
  @IsOptional()
  categories?: string[];

  @IsArray()
  @IsOptional()
  brands?: string[];

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsNumber()
  @Min(0)
  @IsOptional()
  minPrice?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxPrice?: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  minRating?: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  maxRating?: number;

  @IsEnum(SortField)
  @IsOptional()
  sortBy?: SortField = SortField.RELEVANCE;

  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder = SortOrder.DESC;

  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @IsString()
  @IsOptional()
  location?: string;

  @IsNumber()
  @Min(0)
  @Max(100000)
  @IsOptional()
  radius?: number; // in kilometers

  @IsObject()
  @IsOptional()
  filters?: Record<string, any>;

  @IsArray()
  @IsOptional()
  facets?: string[];
}

export class SearchSuggestionDto {
  @IsString()
  query: string;

  @IsEnum(SearchType)
  @IsOptional()
  type?: SearchType = SearchType.ALL;

  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  limit?: number = 5;
}

export class IndexDocumentDto {
  @IsString()
  index: string;

  @IsString()
  id: string;

  @IsObject()
  document: Record<string, any>;
}

export class IndexDocumentsDto {
  @IsString()
  index: string;

  @IsArray()
  documents: Array<{
    id: string;
    [key: string]: any;
  }>;
}

export class UpdateDocumentDto {
  @IsString()
  index: string;

  @IsString()
  id: string;

  @IsObject()
  document: Record<string, any>;
}

export class DeleteDocumentDto {
  @IsString()
  index: string;

  @IsString()
  id: string;
}

export class CreateIndexDto {
  @IsString()
  uid: string;

  @IsObject()
  @IsOptional()
  primaryKey?: string;

  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;
}

export class UpdateIndexSettingsDto {
  @IsString()
  uid: string;

  @IsObject()
  settings: Record<string, any>;
}

export class SearchAnalyticsDto {
  @IsString()
  query: string;

  @IsEnum(SearchType)
  type: SearchType;

  @IsNumber()
  resultsCount: number;

  @IsNumber()
  @IsOptional()
  userId?: number;

  @IsString()
  @IsOptional()
  sessionId?: string;

  @IsObject()
  @IsOptional()
  filters?: Record<string, any>;

  @IsString()
  @IsOptional()
  userAgent?: string;

  @IsString()
  @IsOptional()
  ip?: string;
}

export class RecommendationQueryDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  productId?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsEnum(['collaborative', 'content_based', 'hybrid', 'popular', 'trending'])
  @IsOptional()
  algorithm?: string = 'hybrid';

  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @IsArray()
  @IsOptional()
  excludeIds?: string[];

  @IsObject()
  @IsOptional()
  context?: Record<string, any>;
}

export class UserBehaviorDto {
  @IsString()
  userId: string;

  @IsString()
  @IsOptional()
  sessionId?: string;

  @IsEnum(['view', 'click', 'add_to_cart', 'purchase', 'like', 'share', 'search', 'filter'])
  action: string;

  @IsString()
  @IsOptional()
  productId?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  brandId?: string;

  @IsString()
  @IsOptional()
  shopId?: string;

  @IsString()
  @IsOptional()
  query?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsNumber()
  @IsOptional()
  value?: number; // for purchase actions

  @IsString()
  @IsOptional()
  timestamp?: string;
}

export class TrendingSearchDto {
  @IsEnum(SearchType)
  @IsOptional()
  type?: SearchType = SearchType.PRODUCTS;

  @IsString()
  @IsOptional()
  timeRange?: string = '7d'; // 1d, 7d, 30d

  @IsNumber()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit?: number = 10;

  @IsString()
  @IsOptional()
  location?: string;
}

export class PopularProductsDto {
  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  brandId?: string;

  @IsString()
  @IsOptional()
  timeRange?: string = '7d'; // 1d, 7d, 30d

  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @IsString()
  @IsOptional()
  location?: string;
}

export class SimilarProductsDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit?: number = 10;

  @IsArray()
  @IsOptional()
  excludeIds?: string[];
}

export class AutocompleteDto {
  @IsString()
  query: string;

  @IsEnum(SearchType)
  @IsOptional()
  type?: SearchType = SearchType.PRODUCTS;

  @IsNumber()
  @Min(1)
  @Max(20)
  @IsOptional()
  limit?: number = 5;
}