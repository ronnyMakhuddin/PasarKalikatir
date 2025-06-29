"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Product } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/ProductCard';
import { Search, Store, Users, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProductCatalogProps {
  products: Product[];
}

export function ProductCatalog({ products }: ProductCatalogProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedSeller, setSelectedSeller] = useState('Semua');
  const [categories, setCategories] = useState<string[]>(['Semua']);
  const [sellers, setSellers] = useState<string[]>(['Semua']);
  const [searchType, setSearchType] = useState<'product' | 'seller'>('product');

  // Initialize from URL parameters
  useEffect(() => {
    const sellerParam = searchParams.get('seller');
    if (sellerParam && sellerParam !== 'all') {
      setSelectedSeller(sellerParam);
      setSearchType('seller');
    }
  }, [searchParams]);

  useEffect(() => {
    const uniqueCategories = ['Semua', ...new Set(products.map(p => p.category))];
    const uniqueSellers = ['Semua', ...new Set(products.map(p => p.sellerName))];
    setCategories(uniqueCategories);
    setSellers(uniqueSellers);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === 'Semua' || product.category === selectedCategory;
      const matchesSeller = selectedSeller === 'Semua' || product.sellerName === selectedSeller;
      
      let matchesSearch = true;
      if (searchTerm) {
        if (searchType === 'product') {
          matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        } else {
          matchesSearch = product.sellerName.toLowerCase().includes(searchTerm.toLowerCase());
        }
      }
      
      return matchesCategory && matchesSeller && matchesSearch;
    });
  }, [products, searchTerm, selectedCategory, selectedSeller, searchType]);

  const clearAllFilters = () => {
    setSelectedCategory('Semua');
    setSelectedSeller('Semua');
    setSearchTerm('');
    setSearchType('product');
    router.push('/');
  };

  return (
    <div>
      <div className="mb-6 md:mb-8 space-y-4">
        {/* Search Type Toggle */}
        <div className="flex justify-center gap-2">
          <Button
            variant={searchType === 'product' ? 'default' : 'outline'}
            onClick={() => setSearchType('product')}
            size="sm"
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            Cari Produk
          </Button>
          <Button
            variant={searchType === 'seller' ? 'default' : 'outline'}
            onClick={() => setSearchType('seller')}
            size="sm"
            className="flex items-center gap-2"
          >
            <Store className="h-4 w-4" />
            Cari Pedagang
          </Button>
        </div>

        {/* Search Input */}
        <div className="relative w-full max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={searchType === 'product' ? "Cari nama produk..." : "Cari nama pedagang..."}
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

        {/* Seller Filter */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-center text-muted-foreground flex items-center justify-center gap-2">
            <Users className="h-4 w-4" />
            Filter Pedagang
          </h3>
          <div className="flex gap-2 flex-wrap justify-center">
            {sellers.slice(0, 10).map(seller => (
              <Button
                key={seller}
                variant={selectedSeller === seller ? 'default' : 'outline'}
                onClick={() => setSelectedSeller(seller)}
                size="sm"
                className="text-xs md:text-sm"
              >
                {seller}
              </Button>
            ))}
            {sellers.length > 10 && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs md:text-sm"
                onClick={() => setSelectedSeller('Semua')}
              >
                Lihat Semua
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {(selectedCategory !== 'Semua' || selectedSeller !== 'Semua' || searchTerm) && (
          <div className="flex flex-wrap gap-2 justify-center items-center p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Filter Aktif:</span>
            {selectedCategory !== 'Semua' && (
              <Badge variant="secondary" className="text-xs">
                Kategori: {selectedCategory}
              </Badge>
            )}
            {selectedSeller !== 'Semua' && (
              <Badge variant="secondary" className="text-xs">
                Pedagang: {selectedSeller}
              </Badge>
            )}
            {searchTerm && (
              <Badge variant="secondary" className="text-xs">
                {searchType === 'product' ? 'Produk' : 'Pedagang'}: {searchTerm}
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
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground">
          Menampilkan {filteredProducts.length} dari {products.length} produk
          {selectedSeller !== 'Semua' && ` dari ${selectedSeller}`}
        </p>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 md:py-16">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Produk tidak ditemukan
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
