"use server";

import { addDoc, collection, Firestore, getDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface OrderData {
  customer: {
    name: string;
    whatsapp: string;
  };
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    sellerName: string;
    sellerWhatsapp: string;
  }[];
  total: number;
}

interface SellerMessage {
  sellerName: string;
  whatsappUrl: string;
}

export async function submitOrder(orderData: OrderData): Promise<{ success: boolean; error?: string; sellerMessages?: SellerMessage[] }> {
  try {
    // Step 1: Check stock availability (read-only check)
    if (!db) {
      throw new Error("Firebase not configured");
    }

    // Check stock for all items (read-only, no updates)
    for (const item of orderData.items) {
      const productRef = doc(db as Firestore, 'products', item.id);
      const productDoc = await getDoc(productRef);
      
      if (!productDoc.exists()) {
        throw new Error(`Produk ${item.name} tidak ditemukan`);
      }
      
      const productData = productDoc.data();
      const currentStock = productData.stock || 0;
      
      if (currentStock < item.quantity) {
        throw new Error(`Stok tidak cukup untuk ${item.name}. Tersedia: ${currentStock}, Dibutuhkan: ${item.quantity}`);
      }
    }

    // Step 2: Save the order to Firebase
    const orderDoc = {
      customer: orderData.customer,
      items: orderData.items,
      total: orderData.total,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await addDoc(collection(db as Firestore, 'orders'), orderDoc);

    // Step 3: Group items by seller
    const sellers = new Map<string, { sellerName: string; items: typeof orderData.items }>();

    for (const item of orderData.items) {
      if (!sellers.has(item.sellerWhatsapp)) {
        sellers.set(item.sellerWhatsapp, {
          sellerName: item.sellerName,
          items: [],
        });
      }
      sellers.get(item.sellerWhatsapp)!.items.push(item);
    }
    
    // Step 4: Format WhatsApp messages for each seller
    const formatRupiah = (price: number) => {
        return new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          minimumFractionDigits: 0,
        }).format(price);
    };

    const sellerMessages: SellerMessage[] = [];

    for (const [whatsappNumber, data] of sellers.entries()) {
      let message = `Halo ${data.sellerName}, saya mau pesan dari Pasar Desa Kalikatir:\n\n`;
      let sellerTotal = 0;

      data.items.forEach(item => {
          message += `- *${item.name}*\n`;
          message += `  ${item.quantity} x ${formatRupiah(item.price)}\n`;
          sellerTotal += item.price * item.quantity;
      });

      message += `\n*Total Pesanan (untuk Anda): ${formatRupiah(sellerTotal)}*\n`;
      message += `\n---\n`;
      message += `*Data Pemesan:*\n`;
      message += `Nama: ${orderData.customer.name}\n`;
      message += `WhatsApp: ${orderData.customer.whatsapp}\n\n`;
      message += `Mohon konfirmasi ketersediaan dan info pengirimannya. Terima kasih!`;
      
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodedMessage}`;
      
      sellerMessages.push({
        sellerName: data.sellerName,
        whatsappUrl: whatsappUrl
      });
    }
    
    return { success: true, sellerMessages };

  } catch (error) {
    console.error("Error submitting order:", error);
    return { success: false, error: error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui." };
  }
}

// Function to update product stock after order confirmation
export async function updateProductStockAfterConfirmation(orderId: string, sellerId: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!db) {
      throw new Error("Firebase not configured");
    }

    console.log('Updating stock for order:', orderId, 'by seller:', sellerId);

    // Get the order details
    const orderRef = doc(db as Firestore, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (!orderDoc.exists()) {
      throw new Error("Pesanan tidak ditemukan");
    }
    
    const orderData = orderDoc.data();
    
    // Check if order is already confirmed
    if (orderData.status !== 'confirmed') {
      throw new Error("Pesanan belum dikonfirmasi");
    }
    
    // Filter items that belong to this seller
    const sellerItems = orderData.items.filter((item: any) => {
      // Check if the item belongs to this seller
      // We need to get the product data to check sellerId
      return true; // We'll check this in the loop below
    });
    
    console.log('Total items in order:', orderData.items.length);
    console.log('Items to process for seller:', sellerId);
    
    // Update stock only for items that belong to this seller
    for (const item of orderData.items) {
      const productRef = doc(db as Firestore, 'products', item.id);
      const productDoc = await getDoc(productRef);
      
      if (!productDoc.exists()) {
        console.warn(`Produk ${item.name} tidak ditemukan`);
        continue;
      }
      
      const productData = productDoc.data();
      
      // Check if this product belongs to the confirming seller
      if (productData.sellerId !== sellerId) {
        console.log(`Skipping product ${item.name} - belongs to seller ${productData.sellerId}, not ${sellerId}`);
        continue;
      }
      
      console.log(`Processing product ${item.name} for seller ${sellerId}`);
      
      const currentStock = productData.stock || 0;
      
      if (currentStock < item.quantity) {
        throw new Error(`Stok tidak cukup untuk ${item.name}. Tersedia: ${currentStock}, Dibutuhkan: ${item.quantity}`);
      }
      
      // Reduce stock
      const newStock = currentStock - item.quantity;
      
      console.log(`Updating stock for ${item.name}: ${currentStock} -> ${newStock}`);
      
      await updateDoc(productRef, {
        stock: newStock,
        updatedAt: serverTimestamp(),
      });
      
      console.log(`Successfully updated stock for ${item.name}`);
    }
    
    console.log('Stock update completed successfully');
    return { success: true };
    
  } catch (error) {
    console.error("Error updating product stock:", error);
    return { success: false, error: error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui." };
  }
}
