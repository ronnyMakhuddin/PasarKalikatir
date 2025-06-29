"use client";

import { useState, useMemo, useEffect } from 'react';
import type { Product } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/ProductCard';
import { Search } from 'lucide-react';

interface ProductCatalogProps {
  products: Product[];
}

export function ProductCatalog({ products }: ProductCatalogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [categories, setCategories] = useState<string[]>(['Semua']);

  useEffect(() => {
    const uniqueCategories = ['Semua', ...new Set(products.map(p => p.category))];
    setCategories(uniqueCategories);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === 'Semua' || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, searchTerm, selectedCategory]);

  return (
    <div>
      <div className="mb-6 md:mb-8 flex flex-col gap-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari nama produk..."
            className="pl-10 h-10 md:h-11"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap justify-start md:justify-center">
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
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 md:py-16">
          <p className="text-lg md:text-xl text-muted-foreground">
            Produk tidak ditemukan. Coba kata kunci atau kategori lain.
          </p>
        </div>
      )}
    </div>
  );
}
