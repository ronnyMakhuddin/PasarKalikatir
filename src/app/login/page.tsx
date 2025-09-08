"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Leaf, Eye, EyeOff, Shield, Store } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  const { signIn, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  // Handle redirect after successful login
  useEffect(() => {
    if (!authLoading && userProfile && !hasRedirected) {
      setHasRedirected(true);
      if (userProfile.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (userProfile.role === 'seller') {
        // Check if seller is verified
        if (userProfile.isVerified) {
          router.push('/seller/dashboard');
        } else {
          // Redirect unverified sellers to waiting page
          router.push('/seller/waiting-verification');
        }
      } else {
        // For buyers or other roles, redirect to home
        router.push('/');
      }
    }
  }, [userProfile, authLoading, router, hasRedirected]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setHasRedirected(false); // Reset redirect flag

    try {
      await signIn(email, password);
      // Redirect will be handled by useEffect when userProfile updates
    } catch (error: any) {
      setError(error.message || 'Login gagal. Silakan coba lagi.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Masuk ke Pasar Kalikatir</h1>
          <p className="text-muted-foreground">Masuk ke akun Anda untuk melanjutkan</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Login Sistem
            </CardTitle>
            <CardDescription>
              Masukkan email dan password Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan email Anda"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password Anda"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading || authLoading}>
                {loading || authLoading ? 'Memproses...' : 'Masuk'}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-600">
                Belum punya akun penjual?{' '}
                <Link href="/menjadi-pedagang" className="font-medium text-primary hover:underline">
                  Daftar sebagai Pedagang
                </Link>
              </p>
              <p className="text-xs text-gray-500">
                Admin dan Penjual dapat login di halaman ini
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 