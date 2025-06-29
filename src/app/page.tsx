import { getProducts } from '@/lib/products';
import { ProductCatalog } from '@/components/ProductCatalog';
import { Suspense } from 'react';

export default async function Home() {
  const products = await getProducts();

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-headline text-primary mb-3 md:mb-4 leading-tight">
          Pasar Kalikatir
        </h1>
        <p className="text-base md:text-lg text-foreground/80 max-w-2xl mx-auto px-4">
          Temukan produk-produk segar dan kerajinan unik langsung dari tangan-tangan terampil warga desa kami.
        </p>
      </div>
      <Suspense fallback={
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <ProductCatalog products={products} />
      </Suspense>
    </div>
  );
}
