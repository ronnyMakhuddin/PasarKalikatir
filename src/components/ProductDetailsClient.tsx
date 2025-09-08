"use client";

import { useState } from 'react';
import type { Product } from '@/types';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus, ShoppingBasket } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface ProductDetailsClientProps {
  product: Product;
}

export function ProductDetailsClient({ product }: ProductDetailsClientProps) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };
  
  const handleQuantityChange = (change: number) => {
    setQuantity(prev => {
        const newQuantity = prev + change;
        if (newQuantity < 1) return 1;
        if (newQuantity > product.stock) return product.stock;
        return newQuantity;
    });
  }

  return (
    <>
      <Separator className="my-6" />
      <div className="flex items-center gap-4 mb-6">
        <p className="text-sm font-medium">Jumlah:</p>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>
                <Minus className="h-4 w-4" />
            </Button>
            <Input 
                type="number"
                className="w-16 text-center"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value, 10) || 1)))}
                min="1"
                max={product.stock}
            />
            <Button variant="outline" size="icon" onClick={() => handleQuantityChange(1)} disabled={quantity >= product.stock}>
                <Plus className="h-4 w-4" />
            </Button>
        </div>
        <p className="text-sm text-muted-foreground">Stok: {product.stock}</p>
      </div>
      <Button onClick={handleAddToCart} size="lg" className="w-full bg-accent hover:bg-accent/90">
        <ShoppingBasket className="mr-2 h-5 w-5" />
        Tambah ke Keranjang
      </Button>
    </>
  );
}
