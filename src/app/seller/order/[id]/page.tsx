"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, updateDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { updateProductStockAfterConfirmation } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, User, Phone, MapPin, Package, Calendar, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
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

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const orderId = params.id as string;

  useEffect(() => {
    if (!userProfile?.uid || userProfile?.role !== 'seller') {
      router.push('/login');
      return;
    }

    // Check if seller is verified
    if (!userProfile.isVerified) {
      router.push('/seller/waiting-verification');
      return;
    }

    fetchOrder();
  }, [orderId, userProfile]);

  const fetchOrder = async () => {
    if (!db || !orderId) return;

    try {
      const orderRef = doc(db as Firestore, 'orders', orderId);
      const orderDoc = await getDoc(orderRef);

      if (!orderDoc.exists()) {
        toast({
          title: "Pesanan tidak ditemukan",
          description: "Pesanan yang Anda cari tidak ada",
          variant: "destructive",
        });
        router.push('/seller/dashboard');
        return;
      }

      const data = orderDoc.data();
      
      // Filter items that belong to this seller
      const sellerItems = data.items.filter((item: any) => {
        // For now, we'll show all items. In a real app, you might want to filter by seller
        return true;
      });

      if (sellerItems.length === 0) {
        toast({
          title: "Tidak ada item untuk Anda",
          description: "Pesanan ini tidak mengandung produk Anda",
          variant: "destructive",
        });
        router.push('/seller/dashboard');
        return;
      }

      const orderTotal = sellerItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

      const orderData: Order = {
        id: orderDoc.id,
        customer: data.customer,
        items: sellerItems,
        total: orderTotal,
        status: data.status,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };

      setOrder(orderData);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast({
        title: "Gagal memuat pesanan",
        description: "Terjadi kesalahan saat memuat detail pesanan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus: 'confirmed' | 'rejected' | 'completed') => {
    if (!db || !order) return;

    setUpdatingStatus(true);
    try {
      // Update order status
      await updateDoc(doc(db, 'orders', order.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      setOrder(prev => prev ? { ...prev, status: newStatus, updatedAt: new Date() } : null);
      
      // If order is confirmed, update product stock
      if (newStatus === 'confirmed') {
        try {
          const stockResult = await updateProductStockAfterConfirmation(order.id);
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
          description: `Pesanan ${newStatus === 'rejected' ? 'ditolak' : 'diselesaikan'}`,
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
      setUpdatingStatus(false);
    }
  };

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
          <Button onClick={() => router.push('/seller/dashboard')}>
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
          onClick={() => router.push('/seller/dashboard')}
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
        {/* Order Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Informasi Pembeli
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-3 text-gray-500" />
                  <div>
                    <p className="font-medium">{order.customer.name}</p>
                    <p className="text-sm text-gray-600">Nama Pembeli</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-3 text-gray-500" />
                  <div>
                    <p className="font-medium">{order.customer.whatsapp}</p>
                    <p className="text-sm text-gray-600">Nomor WhatsApp</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-3 text-gray-500" />
                  <div>
                    <p className="font-medium">{formatDate(order.createdAt)}</p>
                    <p className="text-sm text-gray-600">Tanggal Pesanan</p>
                  </div>
                </div>
                {order.updatedAt && order.updatedAt.getTime() !== order.createdAt.getTime() && (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-3 text-gray-500" />
                    <div>
                      <p className="font-medium">{formatDate(order.updatedAt)}</p>
                      <p className="text-sm text-gray-600">Terakhir Diperbarui</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Item Pesanan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-gray-600">Kuantitas: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatRupiah(item.price)}</p>
                      <p className="text-sm text-gray-600">per item</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-bold text-primary">{formatRupiah(item.price * item.quantity)}</p>
                      <p className="text-sm text-gray-600">total</p>
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

        {/* Order Actions */}
        <div className="space-y-6">
          {/* Status Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Aksi Pesanan</CardTitle>
              <CardDescription>
                Update status pesanan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.status === 'pending' && (
                  <>
                    <Button 
                      className="w-full" 
                      onClick={() => updateOrderStatus('confirmed')}
                      disabled={updatingStatus}
                    >
                      {updatingStatus ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Mengkonfirmasi...
                        </div>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Konfirmasi Pesanan
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => updateOrderStatus('rejected')}
                      disabled={updatingStatus}
                    >
                      {updatingStatus ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Menolak...
                        </div>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          Tolak Pesanan
                        </>
                      )}
                    </Button>
                  </>
                )}
                
                {order.status === 'confirmed' && (
                  <Button 
                    className="w-full"
                    onClick={() => updateOrderStatus('completed')}
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Menyelesaikan...
                      </div>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Selesaikan Pesanan
                      </>
                    )}
                  </Button>
                )}

                {(order.status === 'completed' || order.status === 'rejected' || order.status === 'cancelled') && (
                  <div className="text-center text-gray-500">
                    <p>Pesanan sudah {order.status === 'completed' ? 'diselesaikan' : order.status === 'rejected' ? 'ditolak' : 'dibatalkan'}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Customer */}
          <Card>
            <CardHeader>
              <CardTitle>Hubungi Pembeli</CardTitle>
              <CardDescription>
                Kirim pesan WhatsApp ke pembeli
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => {
                  const message = `Halo ${order.customer.name}, terima kasih telah berbelanja di Pasar Kalikatir!\n\nPesanan Anda (#${order.id.slice(-8)}) sedang kami proses.\n\nTotal: ${formatRupiah(order.total)}\n\nJika ada pertanyaan, silakan hubungi kami.`;
                  const encodedMessage = encodeURIComponent(message);
                  const whatsappUrl = `https://api.whatsapp.com/send?phone=${order.customer.whatsapp}&text=${encodedMessage}`;
                  window.open(whatsappUrl, '_blank');
                }}
              >
                <Phone className="h-4 w-4 mr-2" />
                Kirim WhatsApp
              </Button>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Pesanan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>ID Pesanan:</span>
                  <span className="font-mono text-sm">#{order.id.slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  {getStatusBadge(order.status)}
                </div>
                <div className="flex justify-between">
                  <span>Jumlah Item:</span>
                  <span>{order.items.length} item</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Kuantitas:</span>
                  <span>{order.items.reduce((sum, item) => sum + item.quantity, 0)} pcs</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total Bayar:</span>
                  <span className="text-primary">{formatRupiah(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 