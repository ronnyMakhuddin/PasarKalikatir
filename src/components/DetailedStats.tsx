"use client";

import { useMemo } from 'react';
import type { Product } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, Package, ShoppingCart, TrendingUp, DollarSign, 
  BarChart3, PieChart, Activity, Target, Award
} from 'lucide-react';

interface DetailedStatsProps {
  products: Product[];
}

export function DetailedStats({ products }: DetailedStatsProps) {
  const stats = useMemo(() => {
    const activeProducts = products.filter(p => p.isActive);
    const uniqueSellers = new Set(products.map(p => p.sellerName));
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
    const categories = new Set(products.map(p => p.category));
    const averagePrice = products.length > 0 ? products.reduce((sum, p) => sum + p.price, 0) / products.length : 0;

    // Category analysis
    const categoryCount: { [key: string]: number } = {};
    products.forEach(p => {
      categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
    });
    const topCategories = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Seller analysis
    const sellerStats: { [key: string]: { count: number; revenue: number } } = {};
    products.forEach(p => {
      if (!sellerStats[p.sellerName]) {
        sellerStats[p.sellerName] = { count: 0, revenue: 0 };
      }
      sellerStats[p.sellerName].count += 1;
      sellerStats[p.sellerName].revenue += p.price * p.stock;
    });
    const topSellers = Object.entries(sellerStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Price range analysis
    const priceRanges = {
      '0-10k': products.filter(p => p.price <= 10000).length,
      '10k-50k': products.filter(p => p.price > 10000 && p.price <= 50000).length,
      '50k-100k': products.filter(p => p.price > 50000 && p.price <= 100000).length,
      '100k+': products.filter(p => p.price > 100000).length,
    };

    return {
      totalProducts: products.length,
      activeProducts: activeProducts.length,
      totalSellers: uniqueSellers.size,
      totalValue,
      categories: categories.size,
      averagePrice,
      topCategories,
      topSellers,
      priceRanges
    };
  }, [products]);

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeProducts} aktif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pedagang</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSellers}</div>
            <p className="text-xs text-muted-foreground">
              Pedagang terdaftar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kategori</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.categories}</div>
            <p className="text-xs text-muted-foreground">
              Jenis produk
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Nilai</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatRupiah(stats.totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Nilai stok produk
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Kategori
          </TabsTrigger>
          <TabsTrigger value="sellers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Pedagang
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Harga
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Distribusi Kategori Produk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topCategories.map((category, index) => (
                  <div key={category.category} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <span className="font-medium">{category.category}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{category.count} produk</div>
                      <div className="text-xs text-muted-foreground">
                        {((category.count / stats.totalProducts) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sellers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top 10 Pedagang
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topSellers.map((seller, index) => (
                  <div key={seller.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={index < 3 ? "default" : "outline"}>
                        #{index + 1}
                      </Badge>
                      <span className="font-medium">{seller.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{seller.count} produk</div>
                      <div className="text-xs text-green-600">
                        {formatRupiah(seller.revenue)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Distribusi Harga
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.priceRanges).map(([range, count]) => (
                    <div key={range} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium">{range}</span>
                      <div className="text-right">
                        <div className="font-semibold">{count} produk</div>
                        <div className="text-xs text-muted-foreground">
                          {((count / stats.totalProducts) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Analisis Harga
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Rata-rata Harga</span>
                    <span className="font-semibold text-green-600">
                      {formatRupiah(stats.averagePrice)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Harga Tertinggi</span>
                    <span className="font-semibold text-red-600">
                      {formatRupiah(Math.max(...products.map(p => p.price)))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Harga Terendah</span>
                    <span className="font-semibold text-blue-600">
                      {formatRupiah(Math.min(...products.map(p => p.price)))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 