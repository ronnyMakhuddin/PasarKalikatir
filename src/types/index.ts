export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  image: string;
  imageUrl?: string;
  images?: string[];
  category: string;
  stock: number;
  sellerName: string;
  sellerId: string;
  sellerWhatsapp?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  dataAiHint?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
