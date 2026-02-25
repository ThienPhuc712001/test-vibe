import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Marketplace - Shop Everything You Need',
    template: '%s | Marketplace',
  },
  description: 'Multi-vendor marketplace platform similar to Shopee, Lazada, and TikTok Shop',
  keywords: ['marketplace', 'shopping', 'ecommerce', 'vendor', 'seller'],
  authors: [{ name: 'Marketplace Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://marketplace.com',
    title: 'Marketplace - Shop Everything You Need',
    description: 'Multi-vendor marketplace platform',
    siteName: 'Marketplace',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marketplace - Shop Everything You Need',
    description: 'Multi-vendor marketplace platform',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <QueryClientProvider client={queryClient}>
        <html lang="en" suppressHydrationWarning>
          <body className={inter.className}>
            <Providers>
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#22c55e',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 5000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </Providers>
            <ReactQueryDevtools initialIsOpen={false} />
          </body>
        </html>
      </QueryClientProvider>
    </ClerkProvider>
  );
}