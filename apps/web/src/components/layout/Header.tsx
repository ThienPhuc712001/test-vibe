'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Search, ShoppingCart, User, Menu, X, Heart, Bell } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { SearchBar } from '../search/SearchBar';
import { CartDropdown } from '../cart/CartDropdown';
import { UserMenu } from '../auth/UserMenu';
import { MobileMenu } from '../navigation/MobileMenu';
import { NotificationDropdown } from '../notifications/NotificationDropdown';
import { WishlistDropdown } from '../wishlist/WishlistDropdown';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useNotifications } from '@/hooks/useNotifications';
import Link from 'next/link';
import { Button } from '../ui/Button';

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isSignedIn, user } = useAuth();
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const { notifications, unreadCount } = useNotifications();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const cartItemsCount = cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;
  const wishlistCount = wishlist?.items?.length || 0;

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-primary text-white py-2 text-center text-sm">
        <div className="container mx-auto px-4">
          <p>🎉 Free shipping on orders over $50! Use code: FREESHIP</p>
        </div>
      </div>

      {/* Main Header */}
      <header
        className={`sticky top-0 z-40 bg-white transition-shadow duration-300 ${
          isScrolled ? 'shadow-md' : ''
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Logo */}
            <div className="flex-1 lg:flex-none">
              <Link href="/" className="inline-block">
                <Logo className="h-8 w-auto" />
              </Link>
            </div>

            {/* Search Bar - Hidden on mobile */}
            <div className="hidden lg:flex flex-1 max-w-2xl mx-8">
              <SearchBar />
            </div>

            {/* Navigation Icons */}
            <div className="flex items-center space-x-4">
              {/* Mobile Search Button */}
              <button className="lg:hidden p-2 rounded-md hover:bg-gray-100">
                <Search className="h-5 w-5" />
              </button>

              {/* Wishlist */}
              <WishlistDropdown count={wishlistCount}>
                <button className="p-2 rounded-md hover:bg-gray-100 relative">
                  <Heart className="h-5 w-5" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </button>
              </WishlistDropdown>

              {/* Notifications - Only for logged in users */}
              {isSignedIn && (
                <NotificationDropdown count={unreadCount}>
                  <button className="p-2 rounded-md hover:bg-gray-100 relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </NotificationDropdown>
              )}

              {/* Cart */}
              <CartDropdown count={cartItemsCount}>
                <button className="p-2 rounded-md hover:bg-gray-100 relative">
                  <ShoppingCart className="h-5 w-5" />
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartItemsCount}
                    </span>
                  )}
                </button>
              </CartDropdown>

              {/* User Menu */}
              {isSignedIn ? (
                <UserMenu user={user} />
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href="/sign-in">
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/sign-up">
                    <Button size="sm">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="lg:hidden pb-4">
            <SearchBar />
          </div>
        </div>

        {/* Category Navigation */}
        <nav className="border-t border-gray-200 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center space-x-8 overflow-x-auto py-3">
              <Link
                href="/categories"
                className="text-sm font-medium text-gray-700 hover:text-primary whitespace-nowrap"
              >
                All Categories
              </Link>
              <Link
                href="/flash-sales"
                className="text-sm font-medium text-red-600 hover:text-red-700 whitespace-nowrap"
              >
                Flash Sales
              </Link>
              <Link
                href="/live-shopping"
                className="text-sm font-medium text-gray-700 hover:text-primary whitespace-nowrap"
              >
                Live Shopping
              </Link>
              <Link
                href="/trending"
                className="text-sm font-medium text-gray-700 hover:text-primary whitespace-nowrap"
              >
                Trending
              </Link>
              <Link
                href="/new-arrivals"
                className="text-sm font-medium text-gray-700 hover:text-primary whitespace-nowrap"
              >
                New Arrivals
              </Link>
              <Link
                href="/brands"
                className="text-sm font-medium text-gray-700 hover:text-primary whitespace-nowrap"
              >
                Brands
              </Link>
              <Link
                href="/vouchers"
                className="text-sm font-medium text-green-600 hover:text-green-700 whitespace-nowrap"
              >
                Vouchers
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
}