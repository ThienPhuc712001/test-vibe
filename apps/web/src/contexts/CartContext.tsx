'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useCart } from '@/hooks/useCart';

interface CartContextType {
  cart: any;
  isLoading: boolean;
  error: any;
  addToCart: (productId: string, variantId?: string, quantity?: number) => void;
  updateCartItem: (itemId: string, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  cartItemsCount: number;
  isAddingToCart: boolean;
  isUpdatingCart: boolean;
  isRemovingFromCart: boolean;
  isClearingCart: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const cartData = useCart();

  return (
    <CartContext.Provider value={cartData}>
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
}