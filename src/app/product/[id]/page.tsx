import { getProductById } from '@/lib/products';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { ProductDetailsClient } from '@/components/ProductDetailsClient';
import { Separator } from '@/components/ui/separator';
import { Store, Package } from 'lucide-react';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Use imageUrl, fallback to image, then to placeholder
  const productImage = product.imageUrl || product.image || '/placeholder-product.jpg';

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
        <div className="relative">
          <div className="aspect-square w-full rounded-lg shadow-lg overflow-hidden bg-gray-100">
            {productImage.startsWith('data:') || productImage.startsWith('http') ? (
              <Image
                src={productImage}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <Image
                src={productImage}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            )}
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <Badge className="bg-accent text-accent-foreground w-fit mb-2">{product.category}</Badge>
          <h1 className="text-4xl font-bold font-headline text-primary mb-4">{product.name}</h1>
          
          <div className="flex items-center text-muted-foreground mb-4">
             <Store className="h-5 w-5 mr-2" />
             <span>Dijual oleh: <span className="font-semibold text-foreground">{product.sellerName}</span></span>
          </div>

          <p className="text-3xl font-bold text-foreground mb-6">{formatRupiah(product.price)}</p>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            {product.description}
          </p>
          <ProductDetailsClient product={product as any} />
        </div>
      </div>
    </div>
  );
}
