'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';

export function Providers({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <NotificationProvider>
          <CartProvider>
            <WishlistProvider>{children}</WishlistProvider>
          </CartProvider>
        </NotificationProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}