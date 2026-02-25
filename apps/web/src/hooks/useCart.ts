import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@clerk/nextjs';
import toast from 'react-hot-toast';

interface CartItem {
  id: string;
  productId: string;
  product: any;
  variantId?: string;
  variant?: any;
  quantity: number;
  price: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

interface Cart {
  id: string;
  userId?: string;
  sessionId?: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

interface CartResponse {
  cart: Cart;
}

export function useCart() {
  const { isSignedIn, userId } = useAuth();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<CartResponse>({
    queryKey: ['cart'],
    queryFn: () => apiClient.get('/cart').then(res => res.data),
    enabled: isSignedIn !== undefined, // Only fetch when auth state is known
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const addToCartMutation = useMutation({
    mutationFn: ({ productId, variantId, quantity }: { productId: string; variantId?: string; quantity: number }) =>
      apiClient.post('/cart/items', { productId, variantId, quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Product added to cart');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add product to cart');
    },
  });

  const updateCartItemMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      apiClient.patch(`/cart/items/${itemId}`, { quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update cart');
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: (itemId: string) =>
      apiClient.delete(`/cart/items/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Product removed from cart');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove product from cart');
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: () => apiClient.delete('/cart'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Cart cleared');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to clear cart');
    },
  });

  const addToCart = (productId: string, variantId?: string, quantity = 1) => {
    addToCartMutation.mutate({ productId, variantId, quantity });
  };

  const updateCartItem = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
    } else {
      updateCartItemMutation.mutate({ itemId, quantity });
    }
  };

  const removeFromCart = (itemId: string) => {
    removeFromCartMutation.mutate(itemId);
  };

  const clearCart = () => {
    clearCartMutation.mutate();
  };

  const cartItemsCount = data?.cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;

  return {
    cart: data?.cart,
    isLoading,
    error,
    refetch,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    cartItemsCount,
    isAddingToCart: addToCartMutation.isPending,
    isUpdatingCart: updateCartItemMutation.isPending,
    isRemovingFromCart: removeFromCartMutation.isPending,
    isClearingCart: clearCartMutation.isPending,
  };
}