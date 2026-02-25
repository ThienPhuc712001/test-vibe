import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface LiveStream {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  streamKey: string;
  streamUrl?: string;
  startTime: string;
  endTime?: string;
  isActive: boolean;
  viewerCount: number;
  likeCount: number;
  shopId: string;
  shop: any;
  hostId: string;
  host: any;
  products: LiveStreamProduct[];
  createdAt: string;
  updatedAt: string;
}

interface LiveStreamProduct {
  id: string;
  liveStreamId: string;
  productId: string;
  product: any;
  discountPercentage?: number;
  salePrice?: number;
  isActive: boolean;
  addedAt: string;
}

interface UseLiveStreamsParams {
  active?: boolean;
  shopId?: string;
  limit?: number;
  page?: number;
}

interface LiveStreamsResponse {
  streams: LiveStream[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function useLiveStreams(params: UseLiveStreamsParams = {}) {
  const {
    data,
    isLoading,
    error,
  } = useQuery<LiveStreamsResponse>({
    queryKey: ['live-streams', params],
    queryFn: () => apiClient.get('/live-streams', { params }).then(res => res.data),
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    streams: data?.streams || [],
    pagination: data?.pagination,
    isLoading,
    error,
  };
}

export function useLiveStream(id: string) {
  const {
    data,
    isLoading,
    error,
  } = useQuery<LiveStream>({
    queryKey: ['live-stream', id],
    queryFn: () => apiClient.get(`/live-streams/${id}`).then(res => res.data),
    enabled: !!id,
    staleTime: 10 * 1000, // 10 seconds
  });

  return {
    stream: data,
    isLoading,
    error,
  };
}

export function useActiveLiveStreams() {
  return useLiveStreams({ active: true });
}

export function useShopLiveStreams(shopId: string) {
  return useLiveStreams({ shopId });
}