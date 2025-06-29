"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { addProduct } from '@/lib/products';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ImageUpload } from '@/components/ImageUpload';
import { ArrowLeft, Plus } from 'lucide-react';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export default function AddProductPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    imageUrl: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    // Validation
    if (!formData.name || !formData.description || !formData.price || !formData.stock || !formData.category) {
      setError('Semua field harus diisi');
      setLoading(false);
      return;
    }

    if (parseInt(formData.price) <= 0) {
      setError('Harga harus lebih dari 0');
      setLoading(false);
      return;
    }

    if (parseInt(formData.stock) < 0) {
      setError('Stok tidak boleh negatif');
      setLoading(false);
      return;
    }

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseInt(formData.price),
        stock: parseInt(formData.stock),
        category: formData.category,
        image: formData.imageUrl || '/placeholder-product.jpg',
        imageUrl: formData.imageUrl || '/placeholder-product.jpg',
        sellerId: userProfile?.uid || '',
        sellerName: userProfile?.name || '',
        sellerWhatsapp: userProfile?.phone || '',
        isActive: true,
      };

      const productId = await addProduct(productData);
      
      if (productId) {
        setMessage('Produk berhasil ditambahkan!');
        // Reset form
        setFormData({
          name: '',
          description: '',
          price: '',
          stock: '',
          category: '',
          imageUrl: '',
        });
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/seller/dashboard');
        }, 2000);
      } else {
        setError('Gagal menambahkan produk');
      }
    } catch (error: any) {
      console.error('Error adding product:', error);
      setError(error.message || 'Gagal menambahkan produk');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, imageUrl }));
  };

  // Don't render if redirecting - MOVED AFTER ALL HOOKS AND FUNCTIONS
  if (!userProfile || userProfile.role !== 'seller' || !userProfile.isVerified) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Dashboard
        </Button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tambah Produk Baru</h1>
        <p className="text-gray-600">
          Tambahkan produk baru ke toko Anda
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Tambah Produk</CardTitle>
          <CardDescription>
            Isi informasi produk yang akan ditambahkan ke toko Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {message && (
              <Alert>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nama Produk *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Masukkan nama produk"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi Produk *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Deskripsikan produk Anda"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Harga (Rp) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0"
                  min="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Stok *</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => handleInputChange('stock', e.target.value)}
                  placeholder="0"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategori *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Produk Segar">Produk Segar</SelectItem>
                  <SelectItem value="Buah">Buah</SelectItem>
                  <SelectItem value="Sayur">Sayur</SelectItem>
                  <SelectItem value="Daging">Daging</SelectItem>
                  <SelectItem value="Ikan">Ikan</SelectItem>
                  <SelectItem value="Kerajinan">Kerajinan</SelectItem>
                  <SelectItem value="Makanan">Makanan</SelectItem>
                  <SelectItem value="Minuman">Minuman</SelectItem>
                  <SelectItem value="Snack">Snack</SelectItem>
                  <SelectItem value="Lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Image Upload Component */}
            <ImageUpload
              onImageChange={handleImageChange}
              currentImage={formData.imageUrl}
            />

            <div className="flex gap-4 pt-4">
              <Button 
                type="submit" 
                disabled={loading}
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                {loading ? 'Menambahkan...' : 'Tambah Produk'}
              </Button>
              
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.push('/seller/dashboard')}
                disabled={loading}
              >
                Batal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 