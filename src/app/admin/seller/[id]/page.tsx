"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, collection, query, where, getDocs, Firestore } from 'firebase/firestore';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  MapPin, 
  Store, 
  Calendar, 
  Mail, 
  Building, 
  Hash,
  Key,
  AlertCircle,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  FileText,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: string;
  isVerified: boolean;
  createdAt: any;
  updatedAt: any;
  // Seller specific fields
  phone?: string;
  storeName?: string;
  storeCategory?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  ktpNumber?: string;
  rejected?: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  isActive: boolean;
  sellerId: string;
  sellerName: string;
  category: string;
  imageUrl?: string;
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

export default function SellerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [seller, setSeller] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
  });

  const sellerId = params.id as string;

  useEffect(() => {
    if (userProfile?.role !== 'admin') {
      router.push('/login');
      return;
    }

    fetchSellerData();
  }, [sellerId, userProfile]);

  const fetchSellerData = async () => {
    if (!db || !sellerId) return;

    try {
      setLoading(true);

      // Fetch seller profile
      const sellerDoc = await getDoc(doc(db as Firestore, 'users', sellerId));
      if (!sellerDoc.exists()) {
        toast({
          title: "Error",
          description: "Penjual tidak ditemukan",
          variant: "destructive",
        });
        router.push('/admin/dashboard');
        return;
      }

      const sellerData = sellerDoc.data() as UserProfile;
      setSeller({
        ...sellerData,
        createdAt: sellerData.createdAt?.toDate ? sellerData.createdAt.toDate() : new Date(sellerData.createdAt),
        updatedAt: sellerData.updatedAt?.toDate ? sellerData.updatedAt.toDate() : new Date(sellerData.updatedAt),
      });

      // Fetch seller products
      const productsRef = collection(db as Firestore, 'products');
      const productsQuery = query(productsRef, where('sellerId', '==', sellerId));
      const productsSnapshot = await getDocs(productsQuery);
      const productsData: Product[] = [];
      
      productsSnapshot.forEach((doc) => {
        const data = doc.data() as Product;
        productsData.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        });
      });

      // Fetch seller orders
      const ordersRef = collection(db as Firestore, 'orders');
      const ordersSnapshot = await getDocs(ordersRef);
      const ordersData: Order[] = [];
      
      ordersSnapshot.forEach((doc) => {
        const data = doc.data() as Order;
        // Filter orders that contain this seller's products
        const sellerItems = data.items.filter((item: any) => {
          return productsData.some(p => p.id === item.id);
        });
        
        if (sellerItems.length > 0) {
          const orderTotal = sellerItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
          ordersData.push({
            ...data,
            id: doc.id,
            items: sellerItems,
            total: orderTotal,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
          });
        }
      });

      // Calculate stats
      const activeProducts = productsData.filter(p => p.isActive).length;
      const lowStockProducts = productsData.filter(p => p.stock < 10 && p.stock > 0).length;
      const pendingOrders = ordersData.filter(o => o.status === 'pending').length;
      const completedOrders = ordersData.filter(o => o.status === 'completed').length;
      const totalRevenue = ordersData
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + o.total, 0);

      setProducts(productsData);
      setOrders(ordersData);
      setStats({
        totalProducts: productsData.length,
        activeProducts,
        lowStockProducts,
        totalOrders: ordersData.length,
        pendingOrders,
        completedOrders,
        totalRevenue,
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching seller data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data penjual",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'Tidak diketahui';
    
    try {
      if (date instanceof Date) {
        return date.toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      if (date.toDate) {
        return date.toDate().toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      if (typeof date === 'string') {
        return new Date(date).toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
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

  const getStoreCategoryLabel = (category: string) => {
    const categories: { [key: string]: string } = {
      'grocery': 'Grocery',
      'food': 'Food',
      'handicraft': 'Kerajinan',
      'fresh-produce': 'Produk Segar',
      'other': 'Lainnya'
    };
    return categories[category] || category;
  };

  const handleResetPassword = async () => {
    if (!seller?.email) {
      setResetMessage('Email seller tidak tersedia');
      return;
    }

    setResetLoading(true);
    setResetMessage('');

    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, seller.email);
      setResetMessage('Email reset password telah dikirim ke ' + seller.email);
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      setResetMessage('Error: ' + (error.message || 'Gagal mengirim email reset password'));
    } finally {
      setResetLoading(false);
    }
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
          <p className="mt-4 text-lg">Memuat data penjual...</p>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Penjual tidak ditemukan</h2>
          <p className="text-gray-600 mb-4">Penjual yang Anda cari tidak ada atau telah dihapus.</p>
          <Button onClick={() => router.push('/admin/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button 
          variant="outline" 
          onClick={() => router.push('/admin/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Dashboard
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Detail Penjual
            </h1>
            <p className="text-gray-600">
              Informasi lengkap penjual dan aktivitas mereka
            </p>
          </div>
          <div className="text-right">
            <Badge variant={seller.isVerified ? "default" : "secondary"} className="text-lg px-4 py-2">
              {seller.isVerified ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Terverifikasi
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Menunggu Verifikasi
                </>
              )}
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
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
              Dari pesanan selesai
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{seller.isVerified ? 'Aktif' : 'Pending'}</div>
            <p className="text-xs text-muted-foreground">
              {seller.isVerified ? 'Sudah diverifikasi' : 'Menunggu verifikasi'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Seller Information */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Informasi Penjual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-3 text-gray-500" />
                  <div>
                    <p className="font-medium">{seller.name}</p>
                    <p className="text-sm text-gray-600">Nama Lengkap</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-3 text-gray-500" />
                  <div>
                    <p className="font-medium">{seller.email}</p>
                    <p className="text-sm text-gray-600">Email</p>
                  </div>
                </div>

                {seller.phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-3 text-gray-500" />
                    <div>
                      <p className="font-medium">{seller.phone}</p>
                      <p className="text-sm text-gray-600">Nomor Telepon</p>
                    </div>
                  </div>
                )}

                {seller.storeName && (
                  <div className="flex items-center">
                    <Store className="h-4 w-4 mr-3 text-gray-500" />
                    <div>
                      <p className="font-medium">{seller.storeName}</p>
                      <p className="text-sm text-gray-600">Nama Toko</p>
                    </div>
                  </div>
                )}

                {seller.storeCategory && (
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-3 text-gray-500" />
                    <div>
                      <p className="font-medium">{seller.storeCategory}</p>
                      <p className="text-sm text-gray-600">Kategori Toko</p>
                    </div>
                  </div>
                )}

                {seller.address && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-3 text-gray-500" />
                    <div>
                      <p className="font-medium">{seller.address}</p>
                      <p className="text-sm text-gray-600">Alamat</p>
                    </div>
                  </div>
                )}

                {seller.city && seller.province && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-3 text-gray-500" />
                    <div>
                      <p className="font-medium">{seller.city}, {seller.province}</p>
                      <p className="text-sm text-gray-600">Kota & Provinsi</p>
                    </div>
                  </div>
                )}

                {seller.ktpNumber && (
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-3 text-gray-500" />
                    <div>
                      <p className="font-medium">{seller.ktpNumber}</p>
                      <p className="text-sm text-gray-600">Nomor KTP</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-3 text-gray-500" />
                  <div>
                    <p className="font-medium">{formatDate(seller.createdAt)}</p>
                    <p className="text-sm text-gray-600">Tanggal Pendaftaran</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products and Orders */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="products" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Produk ({products.length})
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Pesanan ({orders.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Produk Penjual</CardTitle>
                  <CardDescription>
                    Daftar semua produk yang dijual oleh penjual ini
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {products.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      Belum ada produk yang ditambahkan
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {products.map((product) => (
                        <div key={product.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{product.name}</h3>
                                <Badge variant={product.isActive ? "default" : "secondary"}>
                                  {product.isActive ? "Aktif" : "Nonaktif"}
                                </Badge>
                                <Badge variant={product.stock === 0 ? "destructive" : product.stock < 10 ? "destructive" : "outline"}>
                                  Stok: {product.stock}
                                </Badge>
                              </div>
                              <p className="text-gray-600 mb-2">{product.description}</p>
                              <p className="text-gray-600 mb-1">Kategori: {product.category}</p>
                              <p className="text-lg font-bold text-green-600">{formatRupiah(product.price)}</p>
                              <p className="text-sm text-gray-500">
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

            <TabsContent value="orders" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pesanan Penjual</CardTitle>
                  <CardDescription>
                    Daftar pesanan yang mengandung produk dari penjual ini
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      Belum ada pesanan
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">#{order.id.slice(-8)}</h3>
                                {getStatusBadge(order.status)}
                              </div>
                              <p className="text-gray-600 mb-1">
                                <User className="h-3 w-3 inline mr-1" />
                                {order.customer.name} - {order.customer.whatsapp}
                              </p>
                              <p className="text-sm text-gray-600">
                                {order.items.length} item • {formatRupiah(order.total)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(order.createdAt)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">{formatRupiah(order.total)}</p>
                            </div>
                          </div>
                          
                          <Separator className="my-3" />
                          
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Item Pesanan:</p>
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{item.name} (x{item.quantity})</span>
                                <span>{formatRupiah(item.price * item.quantity)}</span>
                              </div>
                            ))}
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
      </div>

      {/* Reset Password Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Reset Password
          </CardTitle>
          <CardDescription>
            Kirim email reset password ke seller jika mereka lupa password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {resetMessage && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{resetMessage}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">
                Email reset password akan dikirim ke: <strong>{seller.email}</strong>
              </p>
              <p className="text-xs text-gray-500">
                Seller akan menerima email dengan link untuk mengatur ulang password mereka
              </p>
            </div>
            <Button 
              onClick={handleResetPassword} 
              disabled={resetLoading}
              variant="outline"
            >
              <Key className="h-4 w-4 mr-2" />
              {resetLoading ? 'Mengirim...' : 'Reset Password'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 