"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  onImageChange: (imageUrl: string) => void;
  currentImage?: string;
  label?: string;
  description?: string;
}

export function ImageUpload({ 
  onImageChange, 
  currentImage = '', 
  label = "Gambar Produk",
  description = "Upload gambar produk atau masukkan URL gambar"
}: ImageUploadProps) {
  const [imageUrl, setImageUrl] = useState(currentImage);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5MB');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      // For now, we'll use a placeholder service
      // In production, you'd upload to Firebase Storage, Cloudinary, or similar
      const imageUrl = await uploadToPlaceholder(file);
      setImageUrl(imageUrl);
      onImageChange(imageUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Gagal mengupload gambar. Silakan coba lagi.');
    } finally {
      setIsUploading(false);
    }
  };

  const uploadToPlaceholder = async (file: File): Promise<string> => {
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, we'll create a data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleUrlChange = (url: string) => {
    setImageUrl(url);
    onImageChange(url);
    setError('');
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    onImageChange('');
    setError('');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="image">{label}</Label>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Image Preview */}
      {imageUrl && (
        <div className="relative">
          <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
            <img
              src={imageUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
            onClick={handleRemoveImage}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Upload Options */}
      <div className="space-y-3">
        {/* File Upload */}
        <div>
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? 'Mengupload...' : 'Upload Gambar'}
          </Button>
        </div>

        {/* URL Input */}
        <div className="relative">
          <Input
            type="url"
            placeholder="Atau masukkan URL gambar"
            value={imageUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            className="pr-10"
          />
          <ImageIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Help Text */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Format yang didukung: JPG, PNG, GIF</p>
        <p>• Ukuran maksimal: 5MB</p>
        <p>• Atau masukkan URL gambar dari internet</p>
      </div>
    </div>
  );
} 