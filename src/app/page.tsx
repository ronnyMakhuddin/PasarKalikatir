"use client";

import { useState, useEffect } from 'react';

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic';
import { ProductCatalog } from '@/components/ProductCatalog';
import { getProducts } from '@/lib/products';
import { getFirebaseStatus } from '@/lib/firebase';
import type { Product } from '@/types';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const firebaseStatus = getFirebaseStatus();

  // Fetch products on component mount and when needed
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedProducts = await getProducts();
      setProducts(fetchedProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Gagal memuat produk');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Refresh products when page becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchProducts();
      }
    };

    const handleProductAdded = () => {
      fetchProducts();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('productAdded', handleProductAdded);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('productAdded', handleProductAdded);
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      {/* Firebase Status Debug - Only show in production if there are issues */}
      {process.env.NODE_ENV === 'production' && !firebaseStatus.isConfigured && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-semibold mb-2">Firebase Configuration Issue</h3>
          <p className="text-red-700 text-sm mb-2">
            Missing environment variables: {firebaseStatus.missingFields.join(', ')}
          </p>
          <p className="text-red-600 text-xs">
            Please check Vercel environment variables configuration.
          </p>
        </div>
      )}

      {/* Welcome Section */}
      <div className="text-center mb-8 md:mb-12">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-headline text-primary mb-3 md:mb-4 leading-tight">
            Selamat Datang di Pasar Kalikatir
          </h1>
          <p className="text-base md:text-lg text-foreground/80 max-w-3xl mx-auto px-4 mb-4">
            Temukan produk-produk segar dan kerajinan unik langsung dari tangan-tangan terampil warga desa kami.
          </p>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Gagal Memuat Produk
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Products */}
      {!loading && !error && (
        <ProductCatalog products={products} />
      )}
    </div>
  );
}
