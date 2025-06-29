"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, query, where, Firestore, orderBy, limit, startAfter, endBefore, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Users, UserCheck, AlertCircle, ShoppingBag, CheckCircle, XCircle, Eye, 
  TrendingUp, DollarSign, Package, ShoppingCart, Clock, MapPin, Phone,
  Calendar, Store, FileText, BarChart3, Activity, Download, Filter,
  TrendingDown, Award, Star, Target, PieChart, LineChart, ArrowUpRight,
  ArrowDownRight, RefreshCw, Printer, FileSpreadsheet
} from 'lucide-react';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: string;
  isVerified: boolean;
  createdAt: any;
  updatedAt: any;
  phone?: string;
  storeName?: string;
  storeCategory?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  ktpNumber?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  isActive: boolean;
  sellerId: string;
  sellerName: string;
  category: string;
  createdAt: any;
  description?: string;
  images?: string[];
}

interface Order {
  id: string;
  customer: {
    name: string;
    whatsapp: string;
  };
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    sellerName: string;
    sellerId: string;
  }[];
  total: number;
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: any;
  updatedAt: any;
  paymentMethod?: string;
  shippingAddress?: string;
}

interface DetailedStats {
  // Financial
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  revenueGrowth: number;
  orderGrowth: number;
  
  // Sellers
  totalSellers: number;
  verifiedSellers: number;
  pendingSellers: number;
  activeSellers: number;
  newSellersThisMonth: number;
  
  // Products
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  topCategories: { category: string; count: number }[];
  
  // Orders
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  orderStatusDistribution: { status: string; count: number }[];
  
  // Performance
  topSellers: { sellerId: string; sellerName: string; revenue: number; orders: number }[];
  topProducts: { productId: string; productName: string; revenue: number; sales: number }[];
  
  // Time-based
  dailyRevenue: { date: string; revenue: number }[];
  monthlyRevenue: { month: string; revenue: number }[];
}

interface ReportFilters {
  dateRange: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  startDate?: string;
  endDate?: string;
  sellerId?: string;
  category?: string;
  status?: string;
}

export default function AdminReports() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [sellers, setSellers] = useState<UserProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<DetailedStats>({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    revenueGrowth: 0,
    orderGrowth: 0,
    totalSellers: 0,
    verifiedSellers: 0,
    pendingSellers: 0,
    activeSellers: 0,
    newSellersThisMonth: 0,
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    topCategories: [],
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    orderStatusDistribution: [],
    topSellers: [],
    topProducts: [],
    dailyRevenue: [],
    monthlyRevenue: [],
  });
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: 'month',
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (userProfile?.role === 'admin') {
      fetchAllData();
    }
  }, [userProfile, filters]);

  const fetchAllData = async () => {
    if (!db) {
      console.warn('Firebase not configured');
      return;
    }

    try {
      setLoading(true);
      
      // Get date range for filtering
      const { startDate, endDate } = getDateRange(filters.dateRange, filters.startDate, filters.endDate);
      
      // Fetch sellers
      const usersRef = collection(db as Firestore, 'users');
      const sellersQuery = query(usersRef, where('role', '==', 'seller'));
      const sellersSnapshot = await getDocs(sellersQuery);
      
      const sellersData: UserProfile[] = [];
      sellersSnapshot.forEach((doc) => {
        const data = doc.data() as UserProfile;
        sellersData.push({
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
        });
      });

      // Fetch products
      const productsRef = collection(db as Firestore, 'products');
      const productsSnapshot = await getDocs(productsRef);
      const productsData: Product[] = [];
      
      productsSnapshot.forEach((doc) => {
        const data = doc.data() as Product;
        productsData.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        });
      });

      // Fetch orders with date filtering
      const ordersRef = collection(db as Firestore, 'orders');
      let ordersQuery = query(ordersRef, orderBy('createdAt', 'desc'));
      
      if (startDate && endDate) {
        ordersQuery = query(
          ordersRef,
          where('createdAt', '>=', Timestamp.fromDate(new Date(startDate))),
          where('createdAt', '<=', Timestamp.fromDate(new Date(endDate))),
          orderBy('createdAt', 'desc')
        );
      }
      
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersData: Order[] = [];
      
      ordersSnapshot.forEach((doc) => {
        const data = doc.data() as Order;
        ordersData.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
        });
      });

      // Calculate detailed statistics
      const calculatedStats = calculateDetailedStats(sellersData, productsData, ordersData);
      setStats(calculatedStats);
      setSellers(sellersData);
      setProducts(productsData);
      setOrders(ordersData);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const getDateRange = (range: string, customStart?: string, customEnd?: string) => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (range) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        startDate = customStart ? new Date(customStart) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = customEnd ? new Date(customEnd) : now;
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  };

  const calculateDetailedStats = (sellers: UserProfile[], products: Product[], orders: Order[]): DetailedStats => {
    // Financial calculations
    const completedOrders = orders.filter(o => o.status === 'completed');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
    const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

    // Seller calculations
    const verifiedSellers = sellers.filter(s => s.isVerified);
    const pendingSellers = sellers.filter(s => !s.isVerified);
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const newSellersThisMonth = sellers.filter(s => s.createdAt >= thisMonth).length;

    // Product calculations
    const activeProducts = products.filter(p => p.isActive);
    const lowStockProducts = products.filter(p => p.stock < 10 && p.stock > 0);
    const outOfStockProducts = products.filter(p => p.stock === 0);

    // Category analysis
    const categoryCount: { [key: string]: number } = {};
    products.forEach(p => {
      categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
    });
    const topCategories = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Order status distribution
    const statusCount: { [key: string]: number } = {};
    orders.forEach(o => {
      statusCount[o.status] = (statusCount[o.status] || 0) + 1;
    });
    const orderStatusDistribution = Object.entries(statusCount)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);

    // Top sellers analysis
    const sellerRevenue: { [key: string]: { revenue: number; orders: number; name: string } } = {};
    completedOrders.forEach(o => {
      o.items.forEach(item => {
        if (!sellerRevenue[item.sellerId]) {
          sellerRevenue[item.sellerId] = { revenue: 0, orders: 0, name: item.sellerName };
        }
        sellerRevenue[item.sellerId].revenue += item.price * item.quantity;
        sellerRevenue[item.sellerId].orders += 1;
      });
    });
    const topSellers = Object.entries(sellerRevenue)
      .map(([sellerId, data]) => ({
        sellerId,
        sellerName: data.name,
        revenue: data.revenue,
        orders: data.orders,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Top products analysis
    const productSales: { [key: string]: { revenue: number; sales: number; name: string } } = {};
    completedOrders.forEach(o => {
      o.items.forEach(item => {
        if (!productSales[item.id]) {
          productSales[item.id] = { revenue: 0, sales: 0, name: item.name };
        }
        productSales[item.id].revenue += item.price * item.quantity;
        productSales[item.id].sales += item.quantity;
      });
    });
    const topProducts = Object.entries(productSales)
      .map(([productId, data]) => ({
        productId,
        productName: data.name,
        revenue: data.revenue,
        sales: data.sales,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Time-based revenue analysis
    const dailyRevenue: { [key: string]: number } = {};
    const monthlyRevenue: { [key: string]: number } = {};
    
    completedOrders.forEach(o => {
      const date = new Date(o.createdAt);
      const dayKey = date.toISOString().split('T')[0];
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      dailyRevenue[dayKey] = (dailyRevenue[dayKey] || 0) + o.total;
      monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + o.total;
    });

    const dailyRevenueArray = Object.entries(dailyRevenue)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 days

    const monthlyRevenueArray = Object.entries(monthlyRevenue)
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalRevenue,
      totalOrders: orders.length,
      averageOrderValue,
      revenueGrowth: 0, // Would need historical data to calculate
      orderGrowth: 0, // Would need historical data to calculate
      totalSellers: sellers.length,
      verifiedSellers: verifiedSellers.length,
      pendingSellers: pendingSellers.length,
      activeSellers: verifiedSellers.length,
      newSellersThisMonth,
      totalProducts: products.length,
      activeProducts: activeProducts.length,
      lowStockProducts: lowStockProducts.length,
      outOfStockProducts: outOfStockProducts.length,
      topCategories,
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      completedOrders: completedOrders.length,
      cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
      orderStatusDistribution,
      topSellers,
      topProducts,
      dailyRevenue: dailyRevenueArray,
      monthlyRevenue: monthlyRevenueArray,
    };
  };

  const formatDate = (date: any) => {
    if (!date) return 'Tidak diketahui';
    
    try {
      if (date instanceof Date) {
        return date.toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      }
      if (date.toDate) {
        return date.toDate().toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      }
      if (typeof date === 'string') {
        return new Date(date).toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      }
      return 'Tidak diketahui';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Tidak diketahui';
    }
  };

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({
        title: "Error",
        description: "Tidak ada data untuk diekspor",
        variant: "destructive",
      });
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportOrders = () => {
    const exportData = orders.map(order => ({
      'Order ID': order.id,
      'Customer': order.customer.name,
      'WhatsApp': order.customer.whatsapp,
      'Total': order.total,
      'Status': order.status,
      'Tanggal': formatDate(order.createdAt),
      'Item Count': order.items.length,
    }));
    exportToCSV(exportData, `orders-${filters.dateRange}`);
  };

  const handleExportSellers = () => {
    const exportData = sellers.map(seller => ({
      'Nama': seller.name,
      'Email': seller.email,
      'Phone': seller.phone || '',
      'Store Name': seller.storeName || '',
      'Category': seller.storeCategory || '',
      'Address': seller.address || '',
      'Status': seller.isVerified ? 'Terverifikasi' : 'Pending',
      'Tanggal Daftar': formatDate(seller.createdAt),
    }));
    exportToCSV(exportData, `sellers-${filters.dateRange}`);
  };

  const handleExportProducts = () => {
    const exportData = products.map(product => ({
      'Nama Produk': product.name,
      'Penjual': product.sellerName,
      'Kategori': product.category,
      'Harga': product.price,
      'Stok': product.stock,
      'Status': product.isActive ? 'Aktif' : 'Nonaktif',
      'Tanggal Ditambahkan': formatDate(product.createdAt),
    }));
    exportToCSV(exportData, `products-${filters.dateRange}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Memuat laporan...</p>
        </div>
      </div>
    );
  }

  if (!userProfile || userProfile.role !== 'admin') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Laporan Admin
            </h1>
            <p className="text-gray-600">
              Analisis komprehensif platform Pasar Kalikatir
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchAllData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Laporan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="dateRange">Rentang Waktu</Label>
              <Select
                value={filters.dateRange}
                onValueChange={(value) => setFilters({ ...filters, dateRange: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hari Ini</SelectItem>
                  <SelectItem value="week">Minggu Ini</SelectItem>
                  <SelectItem value="month">Bulan Ini</SelectItem>
                  <SelectItem value="quarter">Kuartal Ini</SelectItem>
                  <SelectItem value="year">Tahun Ini</SelectItem>
                  <SelectItem value="custom">Kustom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {filters.dateRange === 'custom' && (
              <>
                <div>
                  <Label htmlFor="startDate">Tanggal Mulai</Label>
                  <Input
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Tanggal Akhir</Label>
                  <Input
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatRupiah(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalOrders} pesanan • Rata-rata {formatRupiah(stats.averageOrderValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Penjual Aktif</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.activeSellers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.newSellersThisMonth} baru bulan ini • {stats.pendingSellers} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produk Aktif</CardTitle>
            <ShoppingBag className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.activeProducts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.lowStockProducts} stok menipis • {stats.outOfStockProducts} habis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pesanan Selesai</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedOrders}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingOrders} pending • {stats.cancelledOrders} dibatalkan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <Tabs defaultValue="financial" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Keuangan
          </TabsTrigger>
          <TabsTrigger value="sellers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Penjual
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Produk
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Pesanan
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analisis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Pendapatan Harian</span>
                  <Button size="sm" variant="outline" onClick={handleExportOrders}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.dailyRevenue.slice(-7).map((day) => (
                    <div key={day.date} className="flex justify-between items-center p-2 border rounded">
                      <span className="text-sm">{formatDate(day.date)}</span>
                      <span className="font-semibold text-green-600">{formatRupiah(day.revenue)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pendapatan Bulanan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.monthlyRevenue.slice(-6).map((month) => (
                    <div key={month.month} className="flex justify-between items-center p-2 border rounded">
                      <span className="text-sm">{month.month}</span>
                      <span className="font-semibold text-green-600">{formatRupiah(month.revenue)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sellers" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Top Penjual</span>
                  <Button size="sm" variant="outline" onClick={handleExportSellers}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.topSellers.map((seller, index) => (
                    <div key={seller.sellerId} className="flex justify-between items-center p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <span className="text-sm font-medium">{seller.sellerName}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">{formatRupiah(seller.revenue)}</div>
                        <div className="text-xs text-gray-500">{seller.orders} pesanan</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistik Penjual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Penjual</span>
                    <Badge variant="outline">{stats.totalSellers}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Terverifikasi</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {stats.verifiedSellers}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Menunggu Verifikasi</span>
                    <Badge variant="secondary">{stats.pendingSellers}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Baru Bulan Ini</span>
                    <Badge variant="outline">{stats.newSellersThisMonth}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Top Produk</span>
                  <Button size="sm" variant="outline" onClick={handleExportProducts}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.topProducts.map((product, index) => (
                    <div key={product.productId} className="flex justify-between items-center p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <span className="text-sm font-medium">{product.productName}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">{formatRupiah(product.revenue)}</div>
                        <div className="text-xs text-gray-500">{product.sales} terjual</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kategori Terpopuler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.topCategories.map((category, index) => (
                    <div key={category.category} className="flex justify-between items-center p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <span className="text-sm font-medium">{category.category}</span>
                      </div>
                      <Badge variant="secondary">{category.count} produk</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Status Pesanan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.orderStatusDistribution.map((status) => (
                    <div key={status.status} className="flex justify-between items-center p-2 border rounded">
                      <span className="text-sm font-medium capitalize">{status.status}</span>
                      <Badge variant="outline">{status.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ringkasan Pesanan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Pesanan</span>
                    <Badge variant="outline">{stats.totalOrders}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Selesai</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {stats.completedOrders}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Pending</span>
                    <Badge variant="secondary">{stats.pendingOrders}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Dibatalkan</span>
                    <Badge variant="destructive">{stats.cancelledOrders}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Analisis Performa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span>Rata-rata Order Value</span>
                    </div>
                    <span className="font-semibold text-green-600">{formatRupiah(stats.averageOrderValue)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-600" />
                      <span>Konversi Penjual</span>
                    </div>
                    <span className="font-semibold text-blue-600">
                      {stats.totalSellers > 0 ? Math.round((stats.activeSellers / stats.totalSellers) * 100) : 0}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-purple-600" />
                      <span>Produk Aktif</span>
                    </div>
                    <span className="font-semibold text-purple-600">
                      {stats.totalProducts > 0 ? Math.round((stats.activeProducts / stats.totalProducts) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.lowStockProducts > 0 && (
                    <div className="p-3 border border-yellow-200 rounded-lg bg-yellow-50">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium text-yellow-800">Stok Menipis</span>
                      </div>
                      <p className="text-sm text-yellow-700">
                        {stats.lowStockProducts} produk memiliki stok di bawah 10 unit
                      </p>
                    </div>
                  )}
                  
                  {stats.pendingSellers > 0 && (
                    <div className="p-3 border border-blue-200 rounded-lg bg-blue-50">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">Verifikasi Pending</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        {stats.pendingSellers} penjual menunggu verifikasi
                      </p>
                    </div>
                  )}
                  
                  {stats.pendingOrders > 0 && (
                    <div className="p-3 border border-orange-200 rounded-lg bg-orange-50">
                      <div className="flex items-center gap-2 mb-1">
                        <ShoppingCart className="h-4 w-4 text-orange-600" />
                        <span className="font-medium text-orange-800">Pesanan Pending</span>
                      </div>
                      <p className="text-sm text-orange-700">
                        {stats.pendingOrders} pesanan menunggu konfirmasi
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 