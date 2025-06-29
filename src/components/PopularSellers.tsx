"use client";

import { useMemo } from 'react';
import type { Product } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Store, Star, Package, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PopularSellersProps {
  products: Product[];
}

interface SellerStats {
  name: string;
  productCount: number;
  totalRevenue: number;
  averageRating: number;
  categories: string[];
}

export function PopularSellers({ products }: PopularSellersProps) {
  const router = useRouter();

  const popularSellers = useMemo(() => {
    const sellerMap = new Map<string, SellerStats>();

    // Calculate seller statistics
    products.forEach(product => {
      if (!sellerMap.has(product.sellerName)) {
        sellerMap.set(product.sellerName, {
          name: product.sellerName,
          productCount: 0,
          totalRevenue: 0,
          averageRating: 4.5, // Placeholder rating
          categories: []
        });
      }

      const seller = sellerMap.get(product.sellerName)!;
      seller.productCount += 1;
      seller.totalRevenue += product.price * product.stock; // Estimate revenue
      
      if (!seller.categories.includes(product.category)) {
        seller.categories.push(product.category);
      }
    });

    // Convert to array and sort by product count
    return Array.from(sellerMap.values())
      .sort((a, b) => b.productCount - a.productCount)
      .slice(0, 6); // Show top 6 sellers
  }, [products]);

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleSellerClick = (sellerName: string) => {
    // Navigate to products filtered by this seller
    const searchParams = new URLSearchParams();
    searchParams.set('seller', sellerName);
    router.push(`/?${searchParams.toString()}`);
  };

  if (popularSellers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Pedagang Terpopuler
        </h2>
        <p className="text-muted-foreground">
          Temukan pedagang terpercaya dengan produk berkualitas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {popularSellers.map((seller, index) => (
          <Card 
            key={seller.name} 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleSellerClick(seller.name)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Store className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold line-clamp-1">
                      {seller.name}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span className="text-xs text-muted-foreground">
                        {seller.averageRating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
                {index < 3 && (
                  <Badge variant="default" className="text-xs">
                    #{index + 1}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Produk</span>
                  <div className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    <span className="font-medium">{seller.productCount}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Estimasi Pendapatan</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="font-medium text-green-600">
                      {formatRupiah(seller.totalRevenue)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-3">
                  {seller.categories.slice(0, 3).map(category => (
                    <Badge key={category} variant="outline" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                  {seller.categories.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{seller.categories.length - 3}
                    </Badge>
                  )}
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSellerClick(seller.name);
                  }}
                >
                  Lihat Produk
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Button 
          variant="outline" 
          onClick={() => router.push('/?seller=all')}
          className="mt-4"
        >
          Lihat Semua Pedagang
        </Button>
      </div>
    </div>
  );
} 