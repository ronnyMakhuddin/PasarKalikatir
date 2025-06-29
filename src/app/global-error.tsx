'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Home, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="mb-8">
              <h1 className="text-6xl font-bold text-red-500 mb-4">Oops!</h1>
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                Terjadi Kesalahan
              </h2>
              <p className="text-gray-600 mb-4">
                Maaf, terjadi kesalahan yang tidak terduga.
              </p>
              {process.env.NODE_ENV === 'development' && (
                <details className="text-left bg-gray-100 p-4 rounded-lg mb-4">
                  <summary className="cursor-pointer font-medium">Error Details</summary>
                  <pre className="text-sm text-red-600 mt-2 whitespace-pre-wrap">
                    {error.message}
                  </pre>
                </details>
              )}
            </div>
            
            <div className="space-x-4">
              <Button onClick={reset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Coba Lagi
              </Button>
              
              <Button variant="outline" asChild>
                <a href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Beranda
                </a>
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
} 