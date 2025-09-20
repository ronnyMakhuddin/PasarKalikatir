"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, updateDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, User, Phone, MapPin, Package, Calendar, Clock, CheckCircle, XCircle, AlertTriangle, ShoppingCart, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  sellerName: string;
  sellerWhatsapp: string;
}

interface Order {
  id: string;
  customer: {
    name: string;
    whatsapp: string;
  };
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const orderId = params.id as string;

  useEffect(() => {
    if (!userProfile?.uid || userProfile?.role !== 'admin') {
      router.push('/login');
      return;
    }

    fetchOrder();
  }, [orderId, userProfile]);

  const fetchOrder = async () => {
    if (!db || !orderId) return;

    try {
      setLoading(true);
      const orderRef = doc(db as Firestore, 'orders', orderId);
      const orderDoc = await getDoc(orderRef);

      if (!orderDoc.exists()) {
        toast({
          title: "Pesanan tidak ditemukan",
          description: "Pesanan yang Anda cari tidak ada",
          variant: "destructive",
        });
        router.push('/admin/dashboard');
        return;
      }

      const data = orderDoc.data();
      const orderData: Order = {
        id: orderDoc.id,
        customer: data.customer,
        items: data.items,
        total: data.total,
        status: data.status,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
      };

      setOrder(orderData);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast({
        title: "Error",
        description: "Gagal memuat detail pesanan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!db || !order) return;

    try {
      setUpdatingStatus(true);
      await updateDoc(doc(db as Firestore, 'orders', order.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      setOrder(prev => prev ? { ...prev, status: newStatus as any, updatedAt: new Date() } : null);
      
      toast({
        title: "Berhasil",
        description: `Status pesanan berhasil diubah menjadi ${getStatusText(newStatus)}`,
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Gagal mengubah status pesanan",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Menunggu';
      case 'confirmed': return 'Dikonfirmasi';
      case 'rejected': return 'Ditolak';
      case 'completed': return 'Selesai';
      case 'shipped': return 'Dikirim';
      case 'delivered': return 'Terkirim';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
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

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Memuat detail pesanan...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Pesanan tidak ditemukan</h2>
          <p className="text-gray-600 mb-4">Pesanan yang Anda cari tidak ada atau telah dihapus.</p>
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
              Detail Pesanan #{order.id.slice(-8)}
            </h1>
            <p className="text-gray-600">
              Informasi lengkap pesanan dari pembeli
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary mb-2">
              {formatRupiah(order.total)}
            </div>
            {getStatusBadge(order.status)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Item Pesanan ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Penjual: {item.sellerName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        WhatsApp: {item.sellerWhatsapp}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatRupiah(item.price)} x {item.quantity}
                      </div>
                      <div className="text-lg font-bold text-primary">
                        {formatRupiah(item.price * item.quantity)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Separator className="my-6" />
              
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total Pesanan:</span>
                <span className="text-primary">{formatRupiah(order.total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Info & Actions */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informasi Pembeli
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{order.customer.name}</p>
                  <p className="text-sm text-muted-foreground">Nama Pembeli</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{order.customer.whatsapp}</p>
                  <p className="text-sm text-muted-foreground">WhatsApp</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Status Pesanan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{formatDate(order.createdAt)}</p>
                  <p className="text-sm text-muted-foreground">Tanggal Pesanan</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{formatDate(order.updatedAt)}</p>
                  <p className="text-sm text-muted-foreground">Terakhir Diupdate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Aksi Admin
              </CardTitle>
              <CardDescription>
                Kelola status pesanan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.status === 'pending' && (
                <>
                  <Button 
                    className="w-full" 
                    onClick={() => updateOrderStatus('confirmed')}
                    disabled={updatingStatus}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Konfirmasi Pesanan
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => updateOrderStatus('rejected')}
                    disabled={updatingStatus}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Tolak Pesanan
                  </Button>
                </>
              )}
              
              {order.status === 'confirmed' && (
                <Button 
                    className="w-full" 
                    onClick={() => updateOrderStatus('shipped')}
                    disabled={updatingStatus}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Tandai Dikirim
                  </Button>
              )}
              
              {order.status === 'shipped' && (
                <Button 
                    className="w-full" 
                    onClick={() => updateOrderStatus('delivered')}
                    disabled={updatingStatus}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Tandai Terkirim
                  </Button>
              )}
              
              {order.status === 'delivered' && (
                <Button 
                    className="w-full" 
                    onClick={() => updateOrderStatus('completed')}
                    disabled={updatingStatus}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Selesaikan Pesanan
                  </Button>
              )}
              
              {(order.status === 'pending' || order.status === 'confirmed') && (
                <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => updateOrderStatus('cancelled')}
                    disabled={updatingStatus}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Batalkan Pesanan
                  </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
