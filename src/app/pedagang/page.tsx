import { getProducts } from '@/lib/products';
import { SellersCatalog } from '@/components/SellersCatalog';
import { Suspense } from 'react';

export default async function SellersPage() {
  const products = await getProducts();

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      {/* Header */}
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-headline text-primary mb-3 md:mb-4 leading-tight">
          Pedagang Pasar Kalikatir
        </h1>
        <p className="text-base md:text-lg text-foreground/80 max-w-3xl mx-auto px-4 mb-4">
          Temukan pedagang terpercaya dengan produk berkualitas dari desa kami.
        </p>
        <p className="text-sm md:text-base text-foreground/60 max-w-2xl mx-auto px-4">
          Dukung ekonomi lokal dengan membeli langsung dari pedagang desa.
        </p>
      </div>

      <Suspense fallback={
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <SellersCatalog products={products} />
      </Suspense>
    </div>
  );
} 