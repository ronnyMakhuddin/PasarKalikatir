"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getProductsBySeller, deleteProduct } from '@/lib/products';
import { collection, getDocs, query, where, Firestore, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { updateProductStockAfterConfirmation } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Package, Plus, ShoppingBag, TrendingUp, Users, ShoppingCart, Clock, CheckCircle, XCircle, AlertTriangle, Trash2 } from 'lucide-react';
import type { Product } from '@/types';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

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
    sellerWhatsapp: string;
  }[];
  total: number;
  status: 'pending' | 'confirmed' | 'rejected' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export default function SellerDashboard() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState<string | null>(null);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
  });

  // Handle redirects
  useEffect(() => {
    if (!userProfile) {
      router.push('/login');
      return;
    }

    if (userProfile.role !== 'seller') {
      router.push('/login');
      return;
    }

    if (!userProfile.isVerified) {
      router.push('/seller/waiting-verification');
      return;
    }
  }, [userProfile, router]);

  const calculateStats = useCallback(() => {
    if (!products || !orders) return;

    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.stock > 0).length;
    const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= 5).length;
    const outOfStockProducts = products.filter(p => p.stock === 0).length;
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const totalRevenue = orders
      .filter(o => o.status === 'confirmed')
      .reduce((sum, order) => sum + order.total, 0);

    setStats({
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      totalOrders,
      pendingOrders,
      totalRevenue,
    });
  }, [products, orders]);

  // Recalculate stats when products or orders change
  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  // Fetch data only if user is verified seller
  useEffect(() => {
    if (!userProfile?.uid || userProfile?.role !== 'seller') {
      return;
    }

    const fetchData = async () => {
      try {
        console.log('Fetching data for seller:', {
          uid: userProfile.uid,
          role: userProfile.role,
          isVerified: userProfile.isVerified,
          email: userProfile.email
        });

        // Fetch products
        const sellerProducts = await getProductsBySeller(userProfile.uid);
        setProducts(sellerProducts);
        
        // Only fetch orders if seller is verified
        if (userProfile.isVerified && db) {
          try {
            console.log('Seller is verified, attempting to fetch orders...');
            const ordersRef = collection(db as Firestore, 'orders');
            const ordersSnapshot = await getDocs(ordersRef);
            
            console.log('Total orders fetched:', ordersSnapshot.size);
            console.log('Seller products:', sellerProducts.map(p => ({ id: p.id, name: p.name })));
            
            const ordersData: Order[] = [];
            ordersSnapshot.forEach((doc) => {
              const data = doc.data();
              
              // Filter orders that contain this seller's products
              const sellerItems = data.items.filter((item: any) => {
                const isSellerProduct = sellerProducts.some(p => p.id === item.id);
                return isSellerProduct;
              });
              
              if (sellerItems.length > 0) {
                const orderTotal = sellerItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
                ordersData.push({
                  id: doc.id,
                  customer: data.customer,
                  items: sellerItems,
                  total: orderTotal,
                  status: data.status,
                  createdAt: data.createdAt?.toDate() || new Date(),
                  updatedAt: data.updatedAt?.toDate() || new Date(),
                });
              }
            });
            
            // Sort orders by createdAt (newest first)
            ordersData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            
            console.log('Filtered orders for seller:', ordersData);
            setOrders(ordersData);
          } catch (ordersError) {
            console.error('Error fetching orders (seller might not be verified):', ordersError);
            console.error('Error details:', {
              message: ordersError instanceof Error ? ordersError.message : 'Unknown error',
              code: (ordersError as any)?.code,
              sellerInfo: {
                uid: userProfile.uid,
                isVerified: userProfile.isVerified,
                role: userProfile.role
              }
            });
            // If seller is not verified, they cannot read orders - this is expected
            setOrders([]);
          }
        } else {
          console.log('Seller is not verified, skipping orders fetch');
          // Seller is not verified, so they cannot read orders
          setOrders([]);
        }
        
        // Calculate stats after both products and orders are loaded
        calculateStats();
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: (error as any)?.code,
          sellerInfo: {
            uid: userProfile.uid,
            isVerified: userProfile.isVerified,
            role: userProfile.role
          }
        });
        setLoading(false);
      }
    };

    fetchData();
  }, [userProfile?.uid, userProfile?.role, userProfile?.isVerified, calculateStats]);

  // Early return to prevent render if not ready - MOVED AFTER ALL HOOKS
  if (!userProfile || userProfile.role !== 'seller') {
    return null;
  }

  // Show waiting verification message for unverified sellers
  if (!userProfile.isVerified) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Menunggu Verifikasi
            </CardTitle>
            <CardDescription>
              Akun Anda sedang menunggu verifikasi dari admin. Setelah diverifikasi, Anda akan dapat mengakses dashboard penjual.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Status akun Anda: <strong>Belum Diverifikasi</strong>
                </AlertDescription>
              </Alert>
              <p className="text-sm text-muted-foreground">
                Admin akan memverifikasi akun Anda dalam waktu 1-2 hari kerja. 
                Setelah diverifikasi, Anda dapat:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Menambahkan produk ke katalog</li>
                <li>• Mengelola stok produk</li>
                <li>• Melihat pesanan dari pembeli</li>
                <li>• Mengakses statistik penjualan</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
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

  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Habis</Badge>;
    } else if (stock < 10) {
      return <Badge variant="destructive">Stok: {stock}</Badge>;
    } else {
      return <Badge variant="outline">Stok: {stock}</Badge>;
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!userProfile?.uid) return;
    
    if (confirm("Apakah Anda yakin ingin menghapus produk ini?")) {
      try {
        const success = await deleteProduct(productId);
        if (success) {
          setProducts(prev => prev.filter(p => p.id !== productId));
          toast({
            title: "Produk Dihapus",
            description: "Produk berhasil dihapus",
          });
        } else {
          toast({
            title: "Gagal Menghapus Produk",
            description: "Terjadi kesalahan saat menghapus produk",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        toast({
          title: "Gagal Menghapus Produk",
          description: "Terjadi kesalahan saat menghapus produk",
          variant: "destructive",
        });
      }
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: 'confirmed' | 'rejected') => {
    if (!db || !userProfile?.uid) return;
    
    setUpdatingOrderStatus(orderId);
    try {
      console.log('Updating order status:', orderId, 'to:', newStatus, 'by seller:', userProfile.uid);
      
      // Update order status
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      
      // Refresh orders data by updating local state and maintain sorting
      setOrders(prev => {
        const updatedOrders = prev.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus, updatedAt: new Date() }
            : order
        );
        // Maintain sorting by createdAt (newest first)
        return updatedOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      });
      
      // If order is confirmed, update product stock
      if (newStatus === 'confirmed') {
        try {
          console.log('Order confirmed, updating stock for seller:', userProfile.uid);
          const stockResult = await updateProductStockAfterConfirmation(orderId, userProfile.uid);
          if (stockResult.success) {
            toast({
              title: "Status berhasil diperbarui",
              description: `Pesanan dikonfirmasi dan stok produk berhasil diperbarui`,
            });
          } else {
            toast({
              title: "Status berhasil diperbarui",
              description: `Pesanan dikonfirmasi, tetapi ada masalah dengan update stok: ${stockResult.error}`,
              variant: "destructive",
            });
          }
        } catch (stockError) {
          console.error('Error updating stock:', stockError);
          toast({
            title: "Status berhasil diperbarui",
            description: `Pesanan dikonfirmasi, tetapi ada masalah dengan update stok`,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Status berhasil diperbarui",
          description: `Pesanan ditolak`,
        });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Gagal memperbarui status",
        description: "Terjadi kesalahan saat memperbarui status pesanan",
        variant: "destructive",
      });
    } finally {
      setUpdatingOrderStatus(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Dashboard Penjual
            </h1>
            <p className="text-gray-600">
              Kelola produk dan pesanan Anda di Pasar Kalikatir
            </p>
          </div>
          <Button onClick={() => router.push('/seller/add-product')}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Produk
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Semua produk
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produk Aktif</CardTitle>
            <ShoppingBag className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeProducts}</div>
            <p className="text-xs text-muted-foreground">
              Tersedia untuk dijual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stok Menipis</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.lowStockProducts}</div>
            <p className="text-xs text-muted-foreground">
              Stok &lt; 10
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stok Habis</CardTitle>
            <ShoppingCart className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.outOfStockProducts}</div>
            <p className="text-xs text-muted-foreground">
              Stok = 0
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Semua pesanan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pesanan Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              Menunggu konfirmasi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{formatRupiah(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Dari semua pesanan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Products and Orders */}
      <Tabs defaultValue="products" className="space-y-6">
        <TabsList>
          <TabsTrigger value="products">Produk</TabsTrigger>
          <TabsTrigger value="orders">Pesanan</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Produk Anda</CardTitle>
              <CardDescription>
                Kelola produk yang Anda jual
              </CardDescription>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Belum ada produk</p>
                  <Button onClick={() => router.push('/seller/add-product')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Produk Pertama
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                          {product.imageUrl || product.image ? (
                            <img
                              src={product.imageUrl || product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium">{product.name}</h3>
                          <p className="text-sm text-gray-600">{product.category}</p>
                          <p className="text-sm font-semibold text-primary">{formatRupiah(product.price)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={product.isActive ? "default" : "secondary"}>
                          {product.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                        {getStockBadge(product.stock)}
                        <Button size="sm" variant="outline" onClick={() => router.push(`/seller/edit-product/${product.id}`)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeleteProduct(product.id || '')}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Pesanan dari Pembeli</CardTitle>
              <CardDescription>
                Kelola pesanan yang masuk
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Belum ada pesanan</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">Pesanan #{order.id.slice(-8)}</h3>
                          <p className="text-sm text-gray-600">
                            {order.customer.name} • {order.customer.whatsapp}
                          </p>
                          <p className="text-xs text-gray-500">
                            {order.createdAt.toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">
                            {formatRupiah(order.total)}
                          </div>
                          {getStatusBadge(order.status)}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span>{item.name} x{item.quantity}</span>
                            <span>{formatRupiah(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex gap-2 mt-4 pt-4 border-t">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => router.push(`/seller/order/${order.id}`)}
                        >
                          Lihat Detail
                        </Button>
                        <div className="flex gap-2">
                          {order.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => updateOrderStatus(order.id, 'confirmed')}
                                disabled={updatingOrderStatus === order.id}
                              >
                                {updatingOrderStatus === order.id ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Konfirmasi
                                  </div>
                                ) : (
                                  'Konfirmasi'
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateOrderStatus(order.id, 'rejected')}
                                disabled={updatingOrderStatus === order.id}
                              >
                                {updatingOrderStatus === order.id ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Tolak
                                  </div>
                                ) : (
                                  'Tolak'
                                )}
                              </Button>
                            </>
                          )}
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