"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getProductById, updateProduct } from '@/lib/products';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ImageUpload } from '@/components/ImageUpload';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import type { Product } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const productId = params.id as string;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    imageUrl: '',
    isActive: true,
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

  useEffect(() => {
    const fetchProduct = async () => {
      if (!params.id || typeof params.id !== 'string') {
        setError('ID produk tidak valid');
        setLoading(false);
        return;
      }

      try {
        const productData = await getProductById(params.id);
        if (!productData) {
          setError('Produk tidak ditemukan');
          setLoading(false);
          return;
        }

        // Check if the product belongs to the current seller
        if (productData.sellerId !== userProfile?.uid) {
          setError('Anda tidak memiliki akses untuk mengedit produk ini');
          setLoading(false);
          return;
        }

        setProduct(productData);
        setFormData({
          name: productData.name,
          description: productData.description,
          price: productData.price.toString(),
          stock: productData.stock.toString(),
          category: productData.category,
          imageUrl: productData.imageUrl || productData.image || '',
          isActive: productData.isActive,
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching product:', error);
        setError('Gagal memuat data produk');
        setLoading(false);
      }
    };

    if (userProfile?.uid) {
      fetchProduct();
    }
  }, [params.id, userProfile?.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    if (!product?.id) {
      setError('ID produk tidak valid');
      setSaving(false);
      return;
    }

    // Validation
    if (!formData.name || !formData.description || !formData.price || !formData.stock || !formData.category) {
      setError('Semua field harus diisi');
      setSaving(false);
      return;
    }

    if (parseInt(formData.price) <= 0) {
      setError('Harga harus lebih dari 0');
      setSaving(false);
      return;
    }

    if (parseInt(formData.stock) < 0) {
      setError('Stok tidak boleh negatif');
      setSaving(false);
      return;
    }

    try {
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseInt(formData.price),
        stock: parseInt(formData.stock),
        category: formData.category,
        imageUrl: formData.imageUrl || '/placeholder-product.jpg',
        image: formData.imageUrl || '/placeholder-product.jpg',
        isActive: formData.isActive,
      };

      const success = await updateProduct(product.id, updateData);
      
      if (success) {
        setMessage('Produk berhasil diperbarui!');
        setTimeout(() => {
          router.push('/seller/dashboard');
        }, 2000);
      } else {
        setError('Gagal memperbarui produk');
      }
    } catch (error: any) {
      console.error('Error updating product:', error);
      setError(error.message || 'Gagal memperbarui produk');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, imageUrl }));
  };

  // Don't render if redirecting - MOVED AFTER ALL HOOKS AND FUNCTIONS
  if (!userProfile || userProfile.role !== 'seller' || !userProfile.isVerified) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Memuat data produk...</p>
        </div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={() => router.push('/seller/dashboard')} className="mt-4">
              Kembali ke Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
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
          Kembali
        </Button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Produk</h1>
        <p className="text-gray-600">
          Perbarui informasi produk Anda
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Edit Produk</CardTitle>
          <CardDescription>
            Perbarui informasi produk yang akan ditampilkan
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
                disabled={saving}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Simpan Perubahan
                  </>
                )}
              </Button>
              
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.push('/seller/dashboard')}
                disabled={saving}
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