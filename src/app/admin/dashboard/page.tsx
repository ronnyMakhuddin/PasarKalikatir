"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where, Firestore, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Users, UserCheck, AlertCircle, ShoppingBag, CheckCircle, XCircle, Eye, 
  TrendingUp, DollarSign, Package, ShoppingCart, Clock, MapPin, Phone,
  Calendar, Store, FileText, BarChart3, Activity, PieChart, Target
} from 'lucide-react';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: string;
  isVerified: boolean;
  createdAt: any; // Firestore timestamp
  updatedAt: any; // Firestore timestamp
  // Seller specific fields
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
}

interface Order {
  id: string;
  customer: {
    name: string;
  };
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    sellerName: string;
  }[];
  total: number;
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: any;
  updatedAt: any;
}

interface Stats {
  totalSellers: number;
  verifiedSellers: number;
  pendingSellers: number;
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

export default function AdminDashboard() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [sellers, setSellers] = useState<UserProfile[]>([]);
  const [pendingSellers, setPendingSellers] = useState<UserProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalSellers: 0,
    verifiedSellers: 0,
    pendingSellers: 0,
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (userProfile?.role === 'admin') {
      fetchAllData();
    }
  }, [userProfile]);

  const fetchAllData = async () => {
    if (!db) {
      console.warn('Firebase not configured');
      return;
    }

    try {
      setLoading(true);
      
      // Fetch sellers
      const usersRef = collection(db as Firestore, 'users');
      const sellersQuery = query(usersRef, where('role', '==', 'seller'));
      const sellersSnapshot = await getDocs(sellersQuery);
      
      const sellersData: UserProfile[] = [];
      const pendingData: UserProfile[] = [];
      
      sellersSnapshot.forEach((doc) => {
        const data = doc.data() as UserProfile;
        const userData: UserProfile = {
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
        };
        
        if (data.isVerified) {
          sellersData.push(userData);
        } else {
          pendingData.push(userData);
        }
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

      // Fetch orders
      const ordersRef = collection(db as Firestore, 'orders');
      const ordersQuery = query(ordersRef, orderBy('createdAt', 'desc'), limit(50));
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

      // Calculate stats
      const activeProducts = productsData.filter(p => p.isActive).length;
      const lowStockProducts = productsData.filter(p => p.stock < 10 && p.stock > 0).length;
      const pendingOrders = ordersData.filter(o => o.status === 'pending').length;
      const completedOrders = ordersData.filter(o => o.status === 'completed').length;
      const totalRevenue = ordersData
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + o.total, 0);
      const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

      setSellers(sellersData);
      setPendingSellers(pendingData);
      setProducts(productsData);
      setOrders(ordersData);
      setRecentOrders(ordersData.slice(0, 10));
      
      setStats({
        totalSellers: sellersData.length + pendingData.length,
        verifiedSellers: sellersData.length,
        pendingSellers: pendingData.length,
        totalProducts: productsData.length,
        activeProducts,
        lowStockProducts,
        totalOrders: ordersData.length,
        pendingOrders,
        completedOrders,
        totalRevenue,
        averageOrderValue,
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleVerifySeller = async (sellerId: string) => {
    if (!db) {
      toast({
        title: "Error",
        description: "Firebase tidak dikonfigurasi",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateDoc(doc(db as Firestore, 'users', sellerId), {
        isVerified: true,
        updatedAt: new Date(),
      });
      
      toast({
        title: "Berhasil",
        description: "Penjual berhasil diverifikasi!",
      });
      
      fetchAllData(); // Refresh data
    } catch (error) {
      console.error('Error verifying seller:', error);
      toast({
        title: "Error",
        description: `Gagal memverifikasi penjual: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleRejectSeller = async (sellerId: string) => {
    if (!db) {
      toast({
        title: "Error",
        description: "Firebase tidak dikonfigurasi",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateDoc(doc(db as Firestore, 'users', sellerId), {
        isVerified: false,
        rejected: true,
        updatedAt: new Date(),
      });
      
      toast({
        title: "Berhasil",
        description: "Penjual berhasil ditolak!",
      });
      
      fetchAllData(); // Refresh data
    } catch (error) {
      console.error('Error rejecting seller:', error);
      toast({
        title: "Error",
        description: `Gagal menolak penjual: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'Tidak diketahui';
    
    try {
      if (date instanceof Date) {
        return date.toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
      if (date.toDate) {
        return date.toDate().toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
      if (typeof date === 'string') {
        return new Date(date).toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Menunggu</Badge>;
      case 'confirmed':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Dikonfirmasi</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Ditolak</Badge>;
      case 'completed':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Selesai</Badge>;
      case 'shipped':
        return <Badge variant="default"><Package className="h-3 w-3 mr-1" />Dikirim</Badge>;
      case 'delivered':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Terkirim</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Dibatalkan</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Calculate detailed statistics
  const getDetailedStats = () => {
    const categoryCount: { [key: string]: number } = {};
    const sellerStats: { [key: string]: { count: number; revenue: number } } = {};
    const priceRanges = {
      '0-10k': products.filter(p => p.price <= 10000).length,
      '10k-50k': products.filter(p => p.price > 10000 && p.price <= 50000).length,
      '50k-100k': products.filter(p => p.price > 50000 && p.price <= 100000).length,
      '100k+': products.filter(p => p.price > 100000).length,
    };

    // Category analysis
    products.forEach(p => {
      categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
    });
    const topCategories = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Seller analysis
    products.forEach(p => {
      if (!sellerStats[p.sellerName]) {
        sellerStats[p.sellerName] = { count: 0, revenue: 0 };
      }
      sellerStats[p.sellerName].count += 1;
    });

    // Add revenue from orders
    orders.forEach(o => {
      if (o.status === 'completed') {
        o.items.forEach(item => {
          if (sellerStats[item.sellerName]) {
            sellerStats[item.sellerName].revenue += item.price * item.quantity;
          }
        });
      }
    });

    const topSellers = Object.entries(sellerStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return { topCategories, topSellers, priceRanges };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  if (!userProfile || userProfile.role !== 'admin') {
    return null;
  }

  const detailedStats = getDetailedStats();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">
              Kelola penjual, produk, dan pesanan di Pasar Kalikatir
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/admin/reports')}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Laporan Lengkap
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Penjual</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSellers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.verifiedSellers} terverifikasi, {stats.pendingSellers} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeProducts} aktif, {stats.lowStockProducts} stok rendah
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingOrders} pending, {stats.completedOrders} selesai
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatRupiah(stats.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Rata-rata {formatRupiah(stats.averageOrderValue)} per pesanan
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Pesanan</TabsTrigger>
          <TabsTrigger value="statistics">Statistik</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Pesanan Terbaru
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{order.customer.name}</span>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {order.items.length} item • {formatRupiah(order.total)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/orders/${order.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Detail
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Belum ada pesanan
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pending Sellers */}
          {pendingSellers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Penjual Menunggu Verifikasi ({pendingSellers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingSellers.slice(0, 5).map((seller) => (
                    <div key={seller.uid} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{seller.name}</span>
                          <Badge variant="secondary">Pending</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{seller.email}</p>
                        {seller.storeName && (
                          <p className="text-sm text-muted-foreground">
                            Toko: {seller.storeName}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleVerifySeller(seller.uid)}
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Verifikasi
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRejectSeller(seller.uid)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Tolak
                        </Button>
                      </div>
                    </div>
                  ))}
                  {pendingSellers.length > 5 && (
                    <div className="text-center">
                      <Button variant="outline" onClick={() => router.push('/admin/sellers')}>
                        Lihat Semua ({pendingSellers.length})
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Semua Pesanan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{order.customer.name}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.items.length} item • {formatRupiah(order.total)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/orders/${order.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Detail
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-6">
          {/* Category Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Analisis Kategori Produk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {detailedStats.topCategories.map((category, index) => (
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

          {/* Top Sellers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Top 10 Penjual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {detailedStats.topSellers.map((seller, index) => (
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

          {/* Price Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Distribusi Harga
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(detailedStats.priceRanges).map(([range, count]) => (
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
                  <Activity className="h-5 w-5" />
                  Analisis Harga
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Rata-rata Harga</span>
                    <span className="font-semibold text-green-600">
                      {formatRupiah(products.length > 0 ? products.reduce((sum, p) => sum + p.price, 0) / products.length : 0)}
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