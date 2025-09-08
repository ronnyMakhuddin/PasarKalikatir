"use client";

import { useCart } from "@/hooks/useCart";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, ShoppingBasket, Store, Trash2 } from "lucide-react";

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, totalPrice, cartCount } = useCart();

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };
  
  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <ShoppingBasket className="mx-auto h-24 w-24 text-muted-foreground mb-4" />
        <h1 className="text-3xl font-bold mb-2">Keranjang Belanja Anda Kosong</h1>
        <p className="text-muted-foreground mb-6">Ayo jelajahi produk-produk desa dan isi keranjang Anda!</p>
        <Button asChild>
          <Link href="/">Mulai Belanja</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold font-headline mb-8">Keranjang Belanja</h1>
      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map(({ product, quantity }) => (
            <Card key={product.id || 'unknown'} className="flex items-center p-4">
              <Image
                src={product.imageUrl || product.image || (product.images && product.images[0]) || '/placeholder-product.jpg'}
                alt={product.name}
                width={100}
                height={100}
                className="rounded-md object-cover aspect-square"
                data-ai-hint={product.dataAiHint}
              />
              <div className="ml-4 flex-grow">
                <Link href={`/product/${product.id || 'unknown'}`} className="font-bold text-lg hover:text-primary">{product.name}</Link>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <Store className="h-4 w-4 mr-1.5"/>
                  <span>Dijual oleh: {product.sellerName}</span>
                </div>
                <p className="text-muted-foreground mt-1">{formatRupiah(product.price)}</p>
              </div>
              <div className="flex items-center gap-2 mx-4">
                 <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(product.id || 'unknown', quantity - 1)} disabled={quantity <= 1}>
                    <Minus className="h-4 w-4" />
                </Button>
                <Input type="number" value={quantity} readOnly className="h-8 w-14 text-center" />
                 <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(product.id || 'unknown', quantity + 1)} disabled={quantity >= product.stock}>
                    <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="w-32 text-right font-semibold text-primary">{formatRupiah(product.price * quantity)}</p>
              <Button variant="ghost" size="icon" className="ml-4 text-destructive" onClick={() => removeFromCart(product.id || 'unknown')}>
                <Trash2 className="h-5 w-5" />
              </Button>
            </Card>
          ))}
        </div>
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Ringkasan Pesanan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Jumlah Produk</span>
                <span>{cartCount}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total Harga</span>
                <span>{formatRupiah(totalPrice)}</span>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-2">
                <Button asChild size="lg" className="w-full bg-accent hover:bg-accent/90">
                    <Link href="/checkout">Lanjut ke Checkout</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                    <Link href="/">Lanjut Belanja</Link>
                </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
