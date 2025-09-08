"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, Firestore } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, CheckCircle, XCircle, RefreshCw, LogOut, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function WaitingVerificationPage() {
  const { userProfile, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  // Redirect if not seller or already verified
  useEffect(() => {
    if (!userProfile) {
      router.push('/login');
      return;
    }

    if (userProfile.role !== 'seller') {
      router.push('/');
      return;
    }

    if (userProfile.isVerified) {
      router.push('/seller/dashboard');
      return;
    }
  }, [userProfile, router]);

  const checkVerificationStatus = async () => {
    if (!db || !userProfile?.uid) return;

    setCheckingStatus(true);
    try {
      const userDoc = await getDoc(doc(db as Firestore, 'users', userProfile.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.isVerified) {
          toast({
            title: "Selamat! Akun Anda telah diverifikasi",
            description: "Anda akan diarahkan ke dashboard penjual",
          });
          // Force reload to update userProfile
          window.location.reload();
        } else {
          toast({
            title: "Belum diverifikasi",
            description: "Akun Anda masih menunggu verifikasi dari admin",
          });
        }
      }
      setLastChecked(new Date());
    } catch (error) {
      console.error('Error checking verification status:', error);
      toast({
        title: "Gagal memeriksa status",
        description: "Terjadi kesalahan saat memeriksa status verifikasi",
        variant: "destructive",
      });
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('Starting logout from waiting verification...');
      await logout();
      console.log('Logout successful from waiting verification');
      router.push('/');
    } catch (error) {
      console.error('Error logging out from waiting verification:', error);
      // Even if logout fails, redirect to home
      router.push('/');
    }
  };

  if (!userProfile || userProfile.role !== 'seller') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Clock className="h-16 w-16 text-orange-500" />
              <div className="absolute -top-1 -right-1">
                <Badge variant="secondary" className="text-xs">
                  Menunggu
                </Badge>
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Menunggu Verifikasi
          </h1>
          <p className="text-gray-600">
            Akun Anda sedang menunggu verifikasi dari admin
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Status Pendaftaran
            </CardTitle>
            <CardDescription>
              Informasi status pendaftaran Anda sebagai penjual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Badge */}
            <div className="flex justify-center">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                <Clock className="h-4 w-4 mr-2" />
                Menunggu Verifikasi Admin
              </Badge>
            </div>

            {/* User Information */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900">Informasi Pendaftaran:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Nama:</span>
                  <p className="text-gray-900">{userProfile.name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Email:</span>
                  <p className="text-gray-900">{userProfile.email}</p>
                </div>
                {userProfile.storeName && (
                  <div>
                    <span className="font-medium text-gray-600">Nama Toko:</span>
                    <p className="text-gray-900">{userProfile.storeName}</p>
                  </div>
                )}
                {userProfile.phone && (
                  <div>
                    <span className="font-medium text-gray-600">Telepon:</span>
                    <p className="text-gray-900">{userProfile.phone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
            <Alert>
              <AlertDescription className="space-y-2">
                <p className="font-medium">Apa yang terjadi selanjutnya?</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Admin akan memeriksa data pendaftaran Anda</li>
                  <li>Proses verifikasi biasanya memakan waktu 1-2 hari kerja</li>
                  <li>Anda akan mendapat notifikasi email setelah diverifikasi</li>
                  <li>Setelah diverifikasi, Anda dapat login dan mengelola toko</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={checkVerificationStatus}
                disabled={checkingStatus}
                className="flex-1"
              >
                {checkingStatus ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Memeriksa...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Periksa Status
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => router.push('/')}
                className="flex-1"
              >
                <Home className="h-4 w-4 mr-2" />
                Kembali ke Beranda
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="flex-1"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>

            {/* Last Checked */}
            <div className="text-center text-xs text-gray-500">
              Terakhir diperiksa: {lastChecked.toLocaleString('id-ID')}
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pertanyaan?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Jika Anda memiliki pertanyaan tentang proses verifikasi, silakan hubungi admin:
            </p>
            <div className="space-y-2 text-sm">
              <p><strong>Email:</strong> admin@pasardesakalikatir.com</p>
              <p><strong>WhatsApp:</strong> +62 812-3456-7890</p>
              <p><strong>Jam Kerja:</strong> Senin - Jumat, 08:00 - 17:00 WIB</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 