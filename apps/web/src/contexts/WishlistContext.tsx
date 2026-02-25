'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useWishlist } from '@/hooks/useWishlist';

interface WishlistContextType {
  wishlist: any;
  isLoading: boolean;
  error: any;
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (itemId: string) => void;
  clearWishlist: () => void;
  isInWishlist: (productId: string) => boolean;
  wishlistCount: number;
  isAddingToWishlist: boolean;
  isRemovingFromWishlist: boolean;
  isClearingWishlist: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const wishlistData = useWishlist();

  return (
    <WishlistContext.Provider value={wishlistData}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlistContext() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlistContext must be used within a WishlistProvider');
  }
  return context;
}