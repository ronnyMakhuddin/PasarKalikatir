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
  Calendar, Store, FileText, BarChart3, Activity
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
    whatsapp: string;
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
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeProducts} aktif, {stats.lowStockProducts} stok menipis
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
            <div className="text-2xl font-bold text-green-600">{formatRupiah(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Rata-rata: {formatRupiah(stats.averageOrderValue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Pesanan Terbaru
          </CardTitle>
          <CardDescription>
            {recentOrders.length} pesanan terbaru
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Belum ada pesanan
            </p>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">#{order.id.slice(-8)}</h3>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-sm text-gray-600">{order.customer.name} - {order.customer.whatsapp}</p>
                    <p className="text-sm text-gray-600">
                      {order.items.length} item • {formatRupiah(order.total)}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{formatRupiah(order.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Menunggu Verifikasi ({pendingSellers.length})
          </TabsTrigger>
          <TabsTrigger value="verified" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Penjual Terverifikasi ({sellers.length})
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Produk ({products.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Penjual Menunggu Verifikasi</CardTitle>
              <CardDescription>
                Verifikasi penjual baru untuk mengaktifkan akun mereka
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingSellers.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Tidak ada penjual yang menunggu verifikasi
                </p>
              ) : (
                <div className="space-y-4">
                  {pendingSellers.map((seller) => (
                    <div key={seller.uid} className="border rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{seller.name}</h3>
                            <Badge variant="secondary">Pending</Badge>
                          </div>
                          <p className="text-gray-600 mb-1">{seller.email}</p>
                          {seller.phone && (
                            <p className="text-gray-600 mb-1">
                              <Phone className="h-3 w-3 inline mr-1" />
                              {seller.phone}
                            </p>
                          )}
                          {seller.storeName && (
                            <p className="text-gray-600 mb-1">
                              <Store className="h-3 w-3 inline mr-1" />
                              {seller.storeName}
                            </p>
                          )}
                          {seller.address && (
                            <p className="text-gray-600 mb-1">
                              <MapPin className="h-3 w-3 inline mr-1" />
                              {seller.address}
                            </p>
                          )}
                          <p className="text-sm text-gray-500">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            Terdaftar: {formatDate(seller.createdAt)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleVerifySeller(seller.uid)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Verifikasi
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectSeller(seller.uid)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Tolak
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => router.push(`/admin/seller/${seller.uid}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Detail
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verified" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Penjual Terverifikasi</CardTitle>
              <CardDescription>
                Daftar penjual yang sudah diverifikasi dan aktif
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sellers.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Belum ada penjual yang terverifikasi
                </p>
              ) : (
                <div className="space-y-4">
                  {sellers.map((seller) => (
                    <div key={seller.uid} className="border rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{seller.name}</h3>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Terverifikasi
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-1">{seller.email}</p>
                          {seller.phone && (
                            <p className="text-gray-600 mb-1">
                              <Phone className="h-3 w-3 inline mr-1" />
                              {seller.phone}
                            </p>
                          )}
                          {seller.storeName && (
                            <p className="text-gray-600 mb-1">
                              <Store className="h-3 w-3 inline mr-1" />
                              {seller.storeName}
                            </p>
                          )}
                          {seller.address && (
                            <p className="text-gray-600 mb-1">
                              <MapPin className="h-3 w-3 inline mr-1" />
                              {seller.address}
                            </p>
                          )}
                          <p className="text-sm text-gray-500">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            Terdaftar: {formatDate(seller.createdAt)}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => router.push(`/admin/seller/${seller.uid}`)}>
                          <Eye className="h-4 w-4 mr-1" />
                          Lihat Detail
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Semua Produk</CardTitle>
              <CardDescription>
                Daftar semua produk yang tersedia di platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Belum ada produk yang tersedia
                </p>
              ) : (
                <div className="space-y-4">
                  {products.map((product) => (
                    <div key={product.id} className="border rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{product.name}</h3>
                            <Badge variant={product.isActive ? "default" : "secondary"}>
                              {product.isActive ? "Aktif" : "Nonaktif"}
                            </Badge>
                            <Badge variant={product.stock === 0 ? "destructive" : product.stock < 10 ? "destructive" : "outline"}>
                              Stok: {product.stock}
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-1">Penjual: {product.sellerName}</p>
                          <p className="text-gray-600 mb-1">Kategori: {product.category}</p>
                          <p className="text-lg font-bold text-green-600">{formatRupiah(product.price)}</p>
                          <p className="text-sm text-gray-500">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            Ditambahkan: {formatDate(product.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 