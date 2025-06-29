import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, Firestore } from 'firebase/firestore';
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