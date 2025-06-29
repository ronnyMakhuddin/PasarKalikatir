"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Product } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProductCard } from '@/components/ProductCard';
import { Search, Store, X, Package, ArrowLeft } from 'lucide-react';

interface SellersCatalogProps {
  products: Product[];
}

interface SellerStats {
  name: string;
  productCount: number;
  categories: string[];
  products: Product[];
}

export function SellersCatalog({ products }: SellersCatalogProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [categories, setCategories] = useState<string[]>(['Semua']);

  // Get selected seller from URL
  const selectedSeller = searchParams.get('seller');

  // Initialize from URL parameters
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const uniqueCategories = ['Semua', ...new Set(products.map(p => p.category))];
    setCategories(uniqueCategories);
  }, [products]);

  const sellers = useMemo(() => {
    const sellerMap = new Map<string, SellerStats>();

    // Calculate seller statistics
    products.forEach(product => {
      if (!sellerMap.has(product.sellerName)) {
        sellerMap.set(product.sellerName, {
          name: product.sellerName,
          productCount: 0,
          categories: [],
          products: []
        });
      }

      const seller = sellerMap.get(product.sellerName)!;
      seller.productCount += 1;
      seller.products.push(product);
      
      if (!seller.categories.includes(product.category)) {
        seller.categories.push(product.category);
      }
    });

    // Convert to array and sort by product count
    return Array.from(sellerMap.values())
      .sort((a, b) => b.productCount - a.productCount);
  }, [products]);

  const filteredSellers = useMemo(() => {
    return sellers.filter(seller => {
      const matchesCategory = selectedCategory === 'Semua' || 
        seller.categories.includes(selectedCategory);
      const matchesSearch = seller.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });
  }, [sellers, searchTerm, selectedCategory]);

  // Filter products for selected seller
  const sellerProducts = useMemo(() => {
    if (!selectedSeller) return [];
    return products.filter(product => product.sellerName === selectedSeller);
  }, [products, selectedSeller]);

  const handleSellerClick = (sellerName: string) => {
    // Stay on pedagang page with seller filter
    const searchParams = new URLSearchParams();
    searchParams.set('seller', sellerName);
    router.push(`/pedagang?${searchParams.toString()}`);
  };

  const clearAllFilters = () => {
    setSelectedCategory('Semua');
    setSearchTerm('');
    router.push('/pedagang');
  };

  const clearSellerFilter = () => {
    router.push('/pedagang');
  };

  // If seller is selected, show their products
  if (selectedSeller) {
    const seller = sellers.find(s => s.name === selectedSeller);
    
    return (
      <div>
        {/* Back to sellers button */}
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={clearSellerFilter}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Daftar Pedagang
          </Button>
        </div>

        {/* Seller info */}
        {seller && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Store className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{seller.name}</CardTitle>
                    <p className="text-muted-foreground">
                      {seller.productCount} produk • {seller.categories.join(', ')}
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Products section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Produk dari {selectedSeller}</h2>
        </div>

        {sellerProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {sellerProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Tidak ada produk
            </h3>
            <p className="text-sm text-muted-foreground">
              Pedagang ini belum memiliki produk yang tersedia.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Show sellers list
  return (
    <div>
      <div className="mb-6 md:mb-8 space-y-4">
        {/* Search Input */}
        <div className="relative w-full max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari nama pedagang..."
            className="pl-10 h-10 md:h-11"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Category Filter */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-center text-muted-foreground">Filter Kategori</h3>
          <div className="flex gap-2 flex-wrap justify-center">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category)}
                size="sm"
                className="text-xs md:text-sm"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Active Filters Display */}
        {(selectedCategory !== 'Semua' || searchTerm) && (
          <div className="flex flex-wrap gap-2 justify-center items-center p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Filter Aktif:</span>
            {selectedCategory !== 'Semua' && (
              <Badge variant="secondary" className="text-xs">
                Kategori: {selectedCategory}
              </Badge>
            )}
            {searchTerm && (
              <Badge variant="secondary" className="text-xs">
                Pedagang: {searchTerm}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs text-red-600 hover:text-red-700 h-6 px-2"
            >
              <X className="h-3 w-3 mr-1" />
              Hapus Semua
            </Button>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="text-center mb-6">
        <p className="text-sm text-muted-foreground">
          Menampilkan {filteredSellers.length} dari {sellers.length} pedagang
        </p>
      </div>

      {filteredSellers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredSellers.map((seller, index) => (
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
      ) : (
        <div className="text-center py-12 md:py-16">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Pedagang tidak ditemukan
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Coba ubah kata kunci atau filter yang Anda gunakan.
            </p>
            <Button variant="outline" onClick={clearAllFilters}>
              Hapus Semua Filter
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 