"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, collection, query, where, getDocs, Firestore, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Users, UserCheck, AlertCircle, ShoppingBag, CheckCircle, XCircle, Eye, 
  TrendingUp, DollarSign, Package, ShoppingCart, Clock, MapPin, Phone,
  Calendar, Store, FileText, BarChart3, Activity, ArrowLeft, Mail,
  Building, MapPin as MapPinIcon, CreditCard
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
}

export default function SellerDetail() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const sellerId = params.id as string;

  const [seller, setSeller] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile?.role === 'admin' && sellerId) {
      fetchSellerData();
    }
  }, [userProfile, sellerId]);

  const fetchSellerData = async () => {
    if (!db) {
      console.warn('Firebase not configured');
      return;
    }

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

      // Fetch seller's products
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
      setProducts(productsData);

      // Fetch seller's orders
      const ordersRef = collection(db as Firestore, 'orders');
      const ordersSnapshot = await getDocs(ordersRef);
      const ordersData: Order[] = [];
      
      ordersSnapshot.forEach((doc) => {
        const data = doc.data() as Order;
        // Filter orders that contain items from this seller
        const sellerItems = data.items.filter(item => item.sellerId === sellerId);
        if (sellerItems.length > 0) {
          ordersData.push({
            ...data,
            id: doc.id,
            items: sellerItems,
            total: sellerItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
          });
        }
      });
      setOrders(ordersData);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching seller data:', error);
      setLoading(false);
    }
  };

  const handleVerifySeller = async () => {
    if (!db || !seller) return;

    try {
      await updateDoc(doc(db as Firestore, 'users', seller.uid), {
        isVerified: true,
        updatedAt: new Date(),
      });
      
      toast({
        title: "Berhasil",
        description: "Penjual berhasil diverifikasi!",
      });
      
      fetchSellerData(); // Refresh data
    } catch (error) {
      console.error('Error verifying seller:', error);
      toast({
        title: "Error",
        description: `Gagal memverifikasi penjual: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
          <p className="mt-4 text-lg">Memuat data penjual...</p>
        </div>
      </div>
    );
  }

  if (!userProfile || userProfile.role !== 'admin') {
    return null;
  }

  if (!seller) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Penjual Tidak Ditemukan</h1>
          <Button onClick={() => router.push('/admin/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Calculate seller statistics
  const activeProducts = products.filter(p => p.isActive).length;
  const totalRevenue = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.total, 0);
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Detail Penjual
              </h1>
              <p className="text-gray-600">
                Informasi lengkap penjual {seller.name}
              </p>
            </div>
          </div>
          {!seller.isVerified && (
            <Button onClick={handleVerifySeller} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Verifikasi Penjual
            </Button>
          )}
        </div>
      </div>

      {/* Seller Profile */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Profil Penjual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{seller.name}</h3>
                <Badge variant={seller.isVerified ? "default" : "secondary"}>
                  {seller.isVerified ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Terverifikasi
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Pending
                    </>
                  )}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{seller.email}</span>
                </div>
                {seller.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{seller.phone}</span>
                  </div>
                )}
                {seller.storeName && (
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-gray-500" />
                    <span>{seller.storeName}</span>
                  </div>
                )}
                {seller.storeCategory && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span>{seller.storeCategory}</span>
                  </div>
                )}
                {seller.address && (
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4 text-gray-500" />
                    <span>{seller.address}</span>
                  </div>
                )}
                {seller.ktpNumber && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-gray-500" />
                    <span>KTP: {seller.ktpNumber}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="text-sm text-gray-500">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4" />
                  <span>Tanggal Daftar</span>
                </div>
                <p className="font-medium">{formatDate(seller.createdAt)}</p>
              </div>
              
              <div className="text-sm text-gray-500">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4" />
                  <span>Terakhir Diupdate</span>
                </div>
                <p className="font-medium">{formatDate(seller.updatedAt)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seller Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeProducts} aktif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">
              {completedOrders} selesai, {pendingOrders} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatRupiah(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Dari {completedOrders} pesanan selesai
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Order</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedOrders > 0 ? formatRupiah(totalRevenue / completedOrders) : formatRupiah(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per pesanan selesai
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Products */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Produk ({products.length})
          </CardTitle>
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
                        <h3 className="text-lg font-semibold">{product.name}</h3>
                        <Badge variant={product.isActive ? "default" : "secondary"}>
                          {product.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                        <Badge variant={product.stock === 0 ? "destructive" : product.stock < 10 ? "destructive" : "outline"}>
                          Stok: {product.stock}
                        </Badge>
                      </div>
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

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Pesanan Terbaru ({orders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Belum ada pesanan
            </p>
          ) : (
            <div className="space-y-4">
              {orders.slice(0, 10).map((order) => (
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
    </div>
  );
} 