import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface FlashSale {
  id: string;
  name: string;
  description?: string;
  banner?: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  products: FlashSaleProduct[];
  createdAt: string;
  updatedAt: string;
}

interface FlashSaleProduct {
  id: string;
  flashSaleId: string;
  productId: string;
  product: any;
  discountPercentage: number;
  salePrice: number;
  maxQuantity: number;
  soldQuantity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UseFlashSalesParams {
  active?: boolean;
  limit?: number;
  page?: number;
}

interface FlashSalesResponse {
  flashSales: FlashSale[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function useFlashSales(params: UseFlashSalesParams = {}) {
  const {
    data,
    isLoading,
    error,
  } = useQuery<FlashSalesResponse>({
    queryKey: ['flash-sales', params],
    queryFn: () => apiClient.get('/flash-sales', { params }).then(res => res.data),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    flashSales: data?.flashSales || [],
    pagination: data?.pagination,
    isLoading,
    error,
  };
}

export function useFlashSale(id: string) {
  const {
    data,
    isLoading,
    error,
  } = useQuery<FlashSale>({
    queryKey: ['flash-sale', id],
    queryFn: () => apiClient.get(`/flash-sales/${id}`).then(res => res.data),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    flashSale: data,
    isLoading,
    error,
  };
}

export function useActiveFlashSales() {
  return useFlashSales({ active: true });
}