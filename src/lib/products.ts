import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, Firestore, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Product } from '@/types';

// Get all active products
export async function getProducts(): Promise<Product[]> {
  if (!db) {
    console.warn('Firebase not configured, returning empty products');
    return [];
  }

  try {
    const productsRef = collection(db as Firestore, 'products');
    const q = query(
      productsRef, 
      where('isActive', '==', true)
      // Temporarily removed orderBy to avoid index requirement
      // orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const products: Product[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const product = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Product;
      
      // Ensure product has all required fields
      if (product.name && product.price && product.sellerId) {
        products.push(product);
      } else {
        console.warn('Skipping invalid product:', product);
      }
    });
    
    // Sort products by createdAt in descending order on client side
    return products.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

// Get product by ID
export async function getProductById(id: string): Promise<Product | null> {
  if (!db) {
    console.warn('Firebase not configured');
    return null;
  }

  try {
    const productDoc = await getDocs(query(collection(db as Firestore, 'products'), where('__name__', '==', id)));
    if (!productDoc.empty) {
      const doc = productDoc.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Product;
    }
    return null;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

// Get products by seller
export async function getProductsBySeller(sellerId: string): Promise<Product[]> {
  if (!db) {
    console.warn('Firebase not configured');
    return [];
  }

  try {
    const productsRef = collection(db as Firestore, 'products');
    const q = query(
      productsRef, 
      where('sellerId', '==', sellerId)
      // Temporarily removed orderBy to avoid index requirement
      // orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const products: Product[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      products.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Product);
    });
    
    // Sort products by createdAt in descending order on client side
    return products.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error fetching seller products:', error);
    return [];
  }
}

// Add new product
export async function addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
  if (!db) {
    console.warn('Firebase not configured');
    return null;
  }

  try {
    const productData = {
      ...product,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const docRef = await addDoc(collection(db as Firestore, 'products'), productData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding product:', error);
    return null;
  }
}

// Update product
export async function updateProduct(id: string, updates: Partial<Product>): Promise<boolean> {
  if (!db) {
    console.warn('Firebase not configured');
    return false;
  }

  try {
    const productRef = doc(db as Firestore, 'products', id);
    await updateDoc(productRef, {
      ...updates,
      updatedAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error('Error updating product:', error);
    return false;
  }
}

// Delete product
export async function deleteProduct(id: string): Promise<boolean> {
  if (!db) {
    console.warn('Firebase not configured');
    return false;
  }

  try {
    await deleteDoc(doc(db as Firestore, 'products', id));
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    return false;
  }
}

// Get products by category
export async function getProductsByCategory(category: string): Promise<Product[]> {
  if (!db) {
    console.warn('Firebase not configured');
    return [];
  }

  try {
    const productsRef = collection(db as Firestore, 'products');
    const q = query(
      productsRef, 
      where('category', '==', category),
      where('isActive', '==', true)
      // Temporarily removed orderBy to avoid index requirement
      // orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const products: Product[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      products.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Product);
    });
    
    // Sort products by createdAt in descending order on client side
    return products.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return [];
  }
}

// Debug function to check product structure
export const debugProduct = async (productId: string) => {
  if (!db) {
    console.error('Firebase not initialized');
    return null;
  }

  try {
    const productDoc = await getDoc(doc(db, 'products', productId));
    if (productDoc.exists()) {
      const data = productDoc.data();
      console.log('Product Debug Info:', {
        id: productId,
        sellerId: data.sellerId,
        name: data.name,
        price: data.price,
        stock: data.stock,
        hasSellerId: !!data.sellerId,
        sellerIdType: typeof data.sellerId
      });
      return data;
    } else {
      console.log('Product not found:', productId);
      return null;
    }
  } catch (error) {
    console.error('Error debugging product:', error);
    return null;
  }
};

// Debug function to check current user
export const debugCurrentUser = async (userId: string) => {
  if (!db) {
    console.error('Firebase not initialized');
    return null;
  }

  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const data = userDoc.data();
      console.log('User Debug Info:', {
        uid: userId,
        role: data.role,
        isVerified: data.isVerified,
        name: data.name,
        email: data.email
      });
      return data;
    } else {
      console.log('User not found:', userId);
      return null;
    }
  } catch (error) {
    console.error('Error debugging user:', error);
    return null;
  }
};

// Enhanced update product function with debugging
export const updateProductStock = async (productId: string, newStock: number, userId: string) => {
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  try {
    // Debug current user
    await debugCurrentUser(userId);
    
    // Debug product before update
    const productData = await debugProduct(productId);
    
    if (!productData) {
      throw new Error('Product not found');
    }

    // Check if user is the seller
    if (productData.sellerId !== userId) {
      console.error('Permission denied: User is not the product seller');
      console.error('Product sellerId:', productData.sellerId);
      console.error('Current userId:', userId);
      throw new Error('Permission denied: You can only update your own products');
    }

    // Update the product
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, {
      stock: newStock,
      updatedAt: new Date()
    });

    console.log('Product stock updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating product stock:', error);
    throw error;
  }
}; 