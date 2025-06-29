"use client";

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { ShoppingBasket, Package } from 'lucide-react';
import { Badge } from './ui/badge';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(product, 1);
  };
  
  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Use imageUrl, fallback to image, then to images array, then to placeholder
  const productImage = product.imageUrl || product.image || (product.images && product.images[0]) || '/placeholder-product.jpg';

  return (
    <Card className="w-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col h-full">
      <CardHeader className="p-0 relative">
        <Link href={`/product/${product.id}`} className="block">
          <div className="aspect-square w-full relative overflow-hidden">
            {productImage.startsWith('data:') || productImage.startsWith('http') ? (
              <Image
                src={productImage}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : (
              <Image
                src={productImage}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            )}
          </div>
        </Link>
        <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground text-xs">{product.category}</Badge>
      </CardHeader>
      <CardContent className="p-3 md:p-4 flex-grow">
        <Link href={`/product/${product.id}`}>
            <CardTitle className="text-base md:text-lg font-bold leading-tight hover:text-primary transition-colors line-clamp-2">
            {product.name}
            </CardTitle>
        </Link>
        {product.sellerName && (
          <p className="text-xs md:text-sm text-gray-600 mt-1">Oleh: {product.sellerName}</p>
        )}
      </CardContent>
      <CardFooter className="p-3 md:p-4 pt-0 flex justify-between items-center">
        <p className="text-lg md:text-xl font-bold text-primary">{formatRupiah(product.price)}</p>
        <Button onClick={handleAddToCart} size="icon" aria-label="Tambah ke keranjang" className="h-8 w-8 md:h-10 md:w-10">
          <ShoppingBasket className="h-4 w-4 md:h-5 md:w-5" />
        </Button>
      </CardFooter>
    </Card>
  );
}
