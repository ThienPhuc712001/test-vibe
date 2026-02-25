import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Category } from '@/types/product';

interface UseCategoriesParams {
  limit?: number;
  parentId?: string;
  includeChildren?: boolean;
  includeProductCount?: boolean;
  activeOnly?: boolean;
}

interface CategoriesResponse {
  categories: Category[];
}

export function useCategories(params: UseCategoriesParams = {}) {
  const {
    data,
    isLoading,
    error,
  } = useQuery<CategoriesResponse>({
    queryKey: ['categories', params],
    queryFn: () => apiClient.get('/categories', { params }).then(res => res.data),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  return {
    categories: data?.categories || [],
    isLoading,
    error,
  };
}

export function useCategory(id: string) {
  const {
    data,
    isLoading,
    error,
  } = useQuery<Category>({
    queryKey: ['category', id],
    queryFn: () => apiClient.get(`/categories/${id}`).then(res => res.data),
    enabled: !!id,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  return {
    category: data,
    isLoading,
    error,
  };
}

export function useRootCategories() {
  return useCategories({ parentId: null, includeChildren: true });
}

export function useFeaturedCategories(limit = 12) {
  return useCategories({ limit, activeOnly: true });
}