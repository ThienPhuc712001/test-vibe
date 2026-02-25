export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  stock: number;
  minOrder?: number;
  maxOrder?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  sku?: string;
  barcode?: string;
  condition: ProductCondition;
  status: ProductStatus;
  categoryId: string;
  category?: Category;
  shopId: string;
  shop?: Shop;
  tags?: string[];
  variants?: ProductVariant[];
  images: ProductImage[];
  specifications?: Record<string, any>;
  shippingOptions?: string[];
  paymentOptions?: string[];
  isFeatured?: boolean;
  isActive?: boolean;
  viewCount?: number;
  rating?: number;
  reviewCount?: number;
  likeCount?: number;
  orderCount?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku?: string;
  price?: number;
  stock?: number;
  image?: string;
  attributes: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  user: User;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  isVerified: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductLike {
  id: string;
  productId: string;
  userId: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  parent?: Category;
  children?: Category[];
  isActive: boolean;
  sortOrder: number;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Shop {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  banner?: string;
  rating?: number;
  reviewCount?: number;
  productCount?: number;
  followerCount?: number;
  isActive: boolean;
  isVerified: boolean;
  userId: string;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  avatar?: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  categoryId?: string;
  shopId?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: ProductCondition;
  status?: ProductStatus;
  tags?: string[];
  sortBy?: 'name' | 'price' | 'createdAt' | 'rating' | 'viewCount' | 'orderCount';
  sortOrder?: 'asc' | 'desc';
  search?: string;
  featured?: boolean;
  trending?: boolean;
}

export enum ProductCondition {
  NEW = 'NEW',
  LIKE_NEW = 'LIKE_NEW',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  POOR = 'POOR',
}

export enum ProductStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DELETED = 'DELETED',
}

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  SELLER = 'SELLER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}