"use client";

import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { CartItem, Product } from '@/types';
import { useToast } from "@/hooks/use-toast";

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  totalPrice: number;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('desaMartCart');
      if (storedCart) {
        setCartItems(JSON.parse(storedCart));
      }
    } catch (error) {
      console.error("Failed to parse cart from localStorage", error);
      localStorage.removeItem('desaMartCart');
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('desaMartCart', JSON.stringify(cartItems));
    } catch (error) {
      console.error("Failed to save cart to localStorage", error);
    }
  }, [cartItems]);

  const addToCart = useCallback((product: Product, quantity: number) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.product.id === product.id);
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock) {
            toast({
                title: "Stok Tidak Cukup",
                description: `Anda tidak dapat menambahkan lebih dari ${product.stock} item.`,
                variant: "destructive",
            });
            return prevItems;
        }
        return prevItems.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      }
      if (quantity > product.stock) {
        toast({
            title: "Stok Tidak Cukup",
            description: `Anda tidak dapat menambahkan lebih dari ${product.stock} item.`,
            variant: "destructive",
        });
        return prevItems;
      }
      return [...prevItems, { product, quantity }];
    });
    toast({
        title: "Produk Ditambahkan",
        description: `${product.name} telah ditambahkan ke keranjang.`,
    });
  }, [toast]);

  const removeFromCart = useCallback((productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.product.id !== productId));
    toast({
        title: "Produk Dihapus",
        description: "Produk telah dihapus dari keranjang.",
        variant: "destructive"
    });
  }, [toast]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setCartItems(prevItems => {
        const itemToUpdate = prevItems.find(item => item.product.id === productId);
        if (!itemToUpdate) return prevItems;
        
        if (quantity > itemToUpdate.product.stock) {
             toast({
                title: "Stok Tidak Cukup",
                description: `Stok maksimum untuk produk ini adalah ${itemToUpdate.product.stock}.`,
                variant: "destructive",
            });
            return prevItems;
        }

        if (quantity <= 0) {
            return prevItems.filter(item => item.product.id !== productId);
        }
        return prevItems.map(item =>
            item.product.id === productId ? { ...item, quantity } : item
        );
    });
  }, [toast]);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const totalPrice = cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};
