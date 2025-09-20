"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, doc, deleteDoc, query, where, Firestore, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Trash2, AlertTriangle, CheckCircle, XCircle, Package, ShoppingCart, 
  Database, RefreshCw, Eye, AlertCircle
} from 'lucide-react';

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
  status: string;
  createdAt: any;
  updatedAt: any;
}

interface InvalidOrder {
  order: Order;
  invalidItems: string[];
  reason: string;
}

export default function AdminCleanupPage() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [invalidOrders, setInvalidOrders] = useState<InvalidOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    invalidOrders: 0,
    validOrders: 0,
    totalItems: 0,
    invalidItems: 0
  });

  useEffect(() => {
    if (userProfile?.role === 'admin') {
      checkInvalidOrders();
    }
  }, [userProfile]);

  const checkInvalidOrders = async () => {
    if (!db) {
      toast({
        title: "Error",
        description: "Firebase tidak dikonfigurasi",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Fetch all orders
      const ordersRef = collection(db as Firestore, 'orders');
      const ordersSnapshot = await getDocs(ordersRef);
      
      const orders: Order[] = [];
      ordersSnapshot.forEach((doc) => {
        const data = doc.data() as Order;
        orders.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
        });
      });

      // Fetch all products to check which ones exist
      const productsRef = collection(db as Firestore, 'products');
      const productsSnapshot = await getDocs(productsRef);
      const existingProductIds = new Set<string>();
      
      productsSnapshot.forEach((doc) => {
        existingProductIds.add(doc.id);
      });

      // Check for invalid orders
      const invalidOrdersList: InvalidOrder[] = [];
      let totalItems = 0;
      let invalidItems = 0;

      for (const order of orders) {
        const invalidItemsInOrder: string[] = [];
        
        for (const item of order.items) {
          totalItems++;
          if (!existingProductIds.has(item.id)) {
            invalidItemsInOrder.push(item.name);
            invalidItems++;
          }
        }

        if (invalidItemsInOrder.length > 0) {
          invalidOrdersList.push({
            order,
            invalidItems: invalidItemsInOrder,
            reason: `Produk tidak ditemukan: ${invalidItemsInOrder.join(', ')}`
          });
        }
      }

      setInvalidOrders(invalidOrdersList);
      setStats({
        totalOrders: orders.length,
        invalidOrders: invalidOrdersList.length,
        validOrders: orders.length - invalidOrdersList.length,
        totalItems,
        invalidItems
      });

    } catch (error) {
      console.error('Error checking invalid orders:', error);
      toast({
        title: "Error",
        description: "Gagal memeriksa pesanan yang tidak valid",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteInvalidOrders = async () => {
    if (!db || invalidOrders.length === 0) return;

    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus ${invalidOrders.length} pesanan yang tidak valid?\n\n` +
      `Tindakan ini akan menghapus pesanan yang memiliki produk yang sudah tidak ada.\n` +
      `Tindakan ini TIDAK DAPAT DIBATALKAN!`
    );

    if (!confirmed) return;

    try {
      setCleaning(true);
      
      // Use batch to delete multiple orders
      const batch = writeBatch(db as Firestore);
      
      for (const invalidOrder of invalidOrders) {
        const orderRef = doc(db as Firestore, 'orders', invalidOrder.order.id);
        batch.delete(orderRef);
      }

      await batch.commit();

      toast({
        title: "Berhasil",
        description: `${invalidOrders.length} pesanan tidak valid berhasil dihapus!`,
      });

      // Refresh the list
      checkInvalidOrders();
      
    } catch (error) {
      console.error('Error deleting invalid orders:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus pesanan tidak valid",
        variant: "destructive",
      });
    } finally {
      setCleaning(false);
    }
  };

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
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

  if (!userProfile || userProfile.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Akses Ditolak</h2>
          <p className="text-gray-600">Hanya admin yang dapat mengakses halaman ini.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Pembersihan Data
        </h1>
        <p className="text-gray-600">
          Kelola dan hapus pesanan yang memiliki produk yang sudah tidak ada
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {stats.validOrders} valid, {stats.invalidOrders} tidak valid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pesanan Tidak Valid</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.invalidOrders}</div>
            <p className="text-xs text-muted-foreground">
              Perlu dibersihkan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Item</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground">
              {stats.invalidItems} item tidak valid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.invalidOrders === 0 ? 'Bersih' : 'Kotor'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.invalidOrders === 0 ? 'Tidak ada masalah' : 'Perlu pembersihan'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Aksi Pembersihan
            </CardTitle>
            <CardDescription>
              Periksa dan hapus pesanan yang memiliki produk yang sudah tidak ada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={checkInvalidOrders} 
                disabled={loading}
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Periksa Ulang
              </Button>
              
              {invalidOrders.length > 0 && (
                <Button 
                  onClick={deleteInvalidOrders} 
                  disabled={cleaning}
                  variant="destructive"
                >
                  <Trash2 className={`h-4 w-4 mr-2 ${cleaning ? 'animate-pulse' : ''}`} />
                  {cleaning ? 'Menghapus...' : `Hapus ${invalidOrders.length} Pesanan Tidak Valid`}
                </Button>
              )}
            </div>

            {stats.invalidOrders === 0 && stats.totalOrders > 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Semua pesanan valid! Tidak ada pesanan yang perlu dibersihkan.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invalid Orders List */}
      {invalidOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Pesanan Tidak Valid ({invalidOrders.length})
            </CardTitle>
            <CardDescription>
              Pesanan berikut memiliki item dengan produk yang sudah tidak ada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invalidOrders.map((invalidOrder) => (
                <div key={invalidOrder.order.id} className="flex items-center justify-between p-4 border rounded-lg bg-red-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{invalidOrder.order.customer.name}</span>
                      <Badge variant="destructive">Tidak Valid</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {invalidOrder.order.items.length} item • {formatRupiah(invalidOrder.order.total)}
                    </p>
                    <p className="text-xs text-red-600 font-medium">
                      {invalidOrder.reason}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Dibuat: {formatDate(invalidOrder.order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-red-600">
                      {invalidOrder.invalidItems.length} item tidak valid
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Memeriksa pesanan...</p>
        </div>
      )}
    </div>
  );
}
