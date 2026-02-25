'use client';

import { useState, useEffect } from 'react';
import { Header } from '../layout/Header';
import { Footer } from '../layout/Footer';
import { HeroSection } from '../sections/HeroSection';
import { CategoryGrid } from '../sections/CategoryGrid';
import { FeaturedProducts } from '../sections/FeaturedProducts';
import { FlashSaleBanner } from '../sections/FlashSaleBanner';
import { TrendingProducts } from '../sections/TrendingProducts';
import { LiveShoppingSection } from '../sections/LiveShoppingSection';
import { RecommendedProducts } from '../sections/RecommendedProducts';
import { BrandShowcase } from '../sections/BrandShowcase';
import { AppPromotion } from '../sections/AppPromotion';
import { NewsletterSection } from '../sections/NewsletterSection';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useFlashSales } from '@/hooks/useFlashSales';
import { useLiveStreams } from '@/hooks/useLiveStreams';

export function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  
  const { 
    data: featuredProducts, 
    isLoading: productsLoading,
    error: productsError 
  } = useProducts({ featured: true, limit: 8 });
  
  const { 
    data: trendingProducts, 
    isLoading: trendingLoading 
  } = useProducts({ trending: true, limit: 8 });
  
  const { 
    data: categories, 
    isLoading: categoriesLoading 
  } = useCategories({ limit: 12 });
  
  const { 
    data: flashSales, 
    isLoading: flashSalesLoading 
  } = useFlashSales({ active: true });
  
  const { 
    data: liveStreams, 
    isLoading: liveStreamsLoading 
  } = useLiveStreams({ active: true, limit: 4 });

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main>
        {/* Hero Section */}
        <HeroSection />
        
        {/* Flash Sale Banner */}
        {!flashSalesLoading && flashSales?.length > 0 && (
          <FlashSaleBanner flashSales={flashSales} />
        )}
        
        {/* Categories Grid */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Shop by Category
              </h2>
              <p className="text-gray-600">
                Find what you're looking for from our wide range of categories
              </p>
            </div>
            <CategoryGrid 
              categories={categories} 
              loading={categoriesLoading} 
            />
          </div>
        </section>
        
        {/* Featured Products */}
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Featured Products
              </h2>
              <p className="text-gray-600">
                Handpicked products just for you
              </p>
            </div>
            <FeaturedProducts 
              products={featuredProducts} 
              loading={productsLoading} 
            />
          </div>
        </section>
        
        {/* Live Shopping Section */}
        {!liveStreamsLoading && liveStreams?.length > 0 && (
          <section className="py-12 bg-white">
            <div className="container mx-auto px-4">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Live Shopping
                </h2>
                <p className="text-gray-600">
                  Join live streams and shop in real-time
                </p>
              </div>
              <LiveShoppingSection streams={liveStreams} />
            </div>
          </section>
        )}
        
        {/* Trending Products */}
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Trending Now
              </h2>
              <p className="text-gray-600">
                See what's popular right now
              </p>
            </div>
            <TrendingProducts 
              products={trendingProducts} 
              loading={trendingLoading} 
            />
          </div>
        </section>
        
        {/* Brand Showcase */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Top Brands
              </h2>
              <p className="text-gray-600">
                Shop from your favorite brands
              </p>
            </div>
            <BrandShowcase />
          </div>
        </section>
        
        {/* Recommended Products */}
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Recommended for You
              </h2>
              <p className="text-gray-600">
                Personalized recommendations based on your preferences
              </p>
            </div>
            <RecommendedProducts />
          </div>
        </section>
        
        {/* App Promotion */}
        <AppPromotion />
        
        {/* Newsletter Section */}
        <NewsletterSection />
      </main>
      
      <Footer />
    </div>
  );
}