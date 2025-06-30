import { getProducts } from '@/lib/products';
import { ProductCatalog } from '@/components/ProductCatalog';
import { Suspense } from 'react';
import { getFirebaseStatus } from '@/lib/firebase';

export default async function Home() {
  const products = await getProducts();
  const firebaseStatus = getFirebaseStatus();

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      {/* Firebase Status Debug - Only show in production if there are issues */}
      {process.env.NODE_ENV === 'production' && !firebaseStatus.isConfigured && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-semibold mb-2">Firebase Configuration Issue</h3>
          <p className="text-red-700 text-sm mb-2">
            Missing environment variables: {firebaseStatus.missingFields.join(', ')}
          </p>
          <p className="text-red-600 text-xs">
            Please check Vercel environment variables configuration.
          </p>
        </div>
      )}

      {/* Welcome Section */}
      <div className="text-center mb-8 md:mb-12">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-headline text-primary mb-3 md:mb-4 leading-tight">
            Selamat Datang di Pasar Kalikatir
          </h1>
          <p className="text-base md:text-lg text-foreground/80 max-w-3xl mx-auto px-4 mb-4">
            Temukan produk-produk segar dan kerajinan unik langsung dari tangan-tangan terampil warga desa kami.
          </p>
        </div>
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
