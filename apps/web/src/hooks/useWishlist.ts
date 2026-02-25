import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@clerk/nextjs';
import toast from 'react-hot-toast';

interface WishlistItem {
  id: string;
  productId: string;
  product: any;
  createdAt: string;
}

interface Wishlist {
  id: string;
  userId?: string;
  sessionId?: string;
  items: WishlistItem[];
  createdAt: string;
  updatedAt: string;
}

interface WishlistResponse {
  wishlist: Wishlist;
}

export function useWishlist() {
  const { isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<WishlistResponse>({
    queryKey: ['wishlist'],
    queryFn: () => apiClient.get('/wishlist').then(res => res.data),
    enabled: isSignedIn,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const addToWishlistMutation = useMutation({
    mutationFn: (productId: string) =>
      apiClient.post('/wishlist/items', { productId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success('Product added to wishlist');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add product to wishlist');
    },
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: (itemId: string) =>
      apiClient.delete(`/wishlist/items/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success('Product removed from wishlist');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove product from wishlist');
    },
  });

  const clearWishlistMutation = useMutation({
    mutationFn: () => apiClient.delete('/wishlist'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success('Wishlist cleared');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to clear wishlist');
    },
  });

  const addToWishlist = (productId: string) => {
    addToWishlistMutation.mutate(productId);
  };

  const removeFromWishlist = (itemId: string) => {
    removeFromWishlistMutation.mutate(itemId);
  };

  const clearWishlist = () => {
    clearWishlistMutation.mutate();
  };

  const isInWishlist = (productId: string) => {
    return data?.wishlist?.items?.some(item => item.productId === productId) || false;
  };

  const wishlistCount = data?.wishlist?.items?.length || 0;

  return {
    wishlist: data?.wishlist,
    isLoading,
    error,
    refetch,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    isInWishlist,
    wishlistCount,
    isAddingToWishlist: addToWishlistMutation.isPending,
    isRemovingFromWishlist: removeFromWishlistMutation.isPending,
    isClearingWishlist: clearWishlistMutation.isPending,
  };
}