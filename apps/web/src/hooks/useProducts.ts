import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Product, ProductFilters } from '@/types/product';

interface UseProductsParams extends Partial<ProductFilters> {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  featured?: boolean;
  trending?: boolean;
  categoryId?: string;
  shopId?: string;
  minPrice?: number;
  maxPrice?: number;
}

interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function useProducts(params: UseProductsParams = {}) {
  const [filters, setFilters] = useState<UseProductsParams>(params);

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<ProductsResponse>({
    queryKey: ['products', filters],
    queryFn: () => apiClient.get('/products', { params: filters }).then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateFilters = (newFilters: Partial<UseProductsParams>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters(params);
  };

  return {
    products: data?.products || [],
    pagination: data?.pagination,
    isLoading,
    error,
    refetch,
    filters,
    updateFilters,
    resetFilters,
  };
}

export function useProduct(id: string) {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<Product>({
    queryKey: ['product', id],
    queryFn: () => apiClient.get(`/products/${id}`).then(res => res.data),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    product: data,
    isLoading,
    error,
    refetch,
  };
}

export function useProductReviews(productId: string, params: { page?: number; limit?: number } = {}) {
  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['product-reviews', productId, params],
    queryFn: () => apiClient.get(`/products/${productId}/reviews`, { params }).then(res => res.data),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    reviews: data?.reviews || [],
    pagination: data?.pagination,
    isLoading,
    error,
  };
}

export function useFeaturedProducts(limit = 8) {
  return useProducts({ featured: true, limit });
}

export function useTrendingProducts(limit = 8) {
  return useProducts({ trending: true, limit });
}

export function useCategoryProducts(categoryId: string, params: UseProductsParams = {}) {
  return useProducts({ categoryId, ...params });
}

export function useShopProducts(shopId: string, params: UseProductsParams = {}) {
  return useProducts({ shopId, ...params });
}

export function useSearchProducts(query: string, params: UseProductsParams = {}) {
  return useProducts({ search: query, ...params });
}