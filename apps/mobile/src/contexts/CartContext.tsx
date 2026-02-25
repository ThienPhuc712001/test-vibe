import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../lib/api-client';

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

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  error: any;
  addToCart: (productId: string, variantId?: string, quantity?: number) => Promise<void>;
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  cartItemsCount: number;
  refetch: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const { isSignedIn } = useAuth();

  const fetchCart = async () => {
    if (!isSignedIn) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get('/cart');
      setCart(response.data.cart);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (productId: string, variantId?: string, quantity = 1) => {
    if (!isSignedIn) return;
    
    try {
      setIsLoading(true);
      await apiClient.post('/cart/items', { productId, variantId, quantity });
      await fetchCart();
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCartItem = async (itemId: string, quantity: number) => {
    if (!isSignedIn) return;
    
    try {
      setIsLoading(true);
      await apiClient.patch(`/cart/items/${itemId}`, { quantity });
      await fetchCart();
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (itemId: string) => {
    if (!isSignedIn) return;
    
    try {
      setIsLoading(true);
      await apiClient.delete(`/cart/items/${itemId}`);
      await fetchCart();
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    if (!isSignedIn) return;
    
    try {
      setIsLoading(true);
      await apiClient.delete('/cart');
      setCart(null);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const cartItemsCount = cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;

  useEffect(() => {
    fetchCart();
  }, [isSignedIn]);

  const value: CartContextType = {
    cart,
    isLoading,
    error,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    cartItemsCount,
    refetch: fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCartContext() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
}