"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/hooks/useCart";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { submitOrder } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, MessageSquareShare } from "lucide-react";
import Link from "next/link";

const checkoutSchema = z.object({
  name: z.string().min(3, { message: "Nama harus diisi, minimal 3 karakter." }),
  whatsapp: z.string().min(10, { message: "Nomor WhatsApp tidak valid." }).regex(/^[0-9]+$/, "Nomor WhatsApp hanya boleh berisi angka."),
});

interface SellerMessage {
  sellerName: string;
  whatsappUrl: string;
}

export default function CheckoutPage() {
  const { cartItems, totalPrice, clearCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [submissionResult, setSubmissionResult] = useState<SellerMessage[] | null>(null);

  const form = useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: "",
      whatsapp: "",
    },
  });

  const { formState: { isSubmitting } } = form;
  
  useEffect(() => {
    // Redirect if cart is empty and the form isn't processing or submitted
    if (cartItems.length === 0 && !isSubmitting && !submissionResult) {
      router.replace("/");
    }
  }, [cartItems, isSubmitting, submissionResult, router]);

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };
  
  // Render a loading state or nothing while redirecting
  if (cartItems.length === 0 && !submissionResult) {
    return null;
  }

  const onSubmit = async (values: z.infer<typeof checkoutSchema>) => {
    const orderData = {
      customer: values,
      items: cartItems.map(item => ({ 
        id: item.product.id, 
        name: item.product.name, 
        quantity: item.quantity, 
        price: item.product.price,
        sellerName: item.product.sellerName,
        sellerWhatsapp: item.product.sellerWhatsapp,
      })),
      total: totalPrice,
    };

    const result = await submitOrder(orderData);

    if (result.success && result.sellerMessages) {
      toast({
        title: "Pesanan Diterima!",
        description: "Silakan hubungi penjual untuk konfirmasi pesanan Anda.",
      });
      clearCart();
      setSubmissionResult(result.sellerMessages);
    } else {
      toast({
        title: "Gagal Membuat Pesanan",
        description: result.error || "Terjadi kesalahan. Silakan coba lagi.",
        variant: "destructive",
      });
    }
  };
  
  if (submissionResult) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="items-center text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <CardTitle className="text-2xl">Pesanan Berhasil Disimpan!</CardTitle>
            <p className="text-muted-foreground">
              Langkah selanjutnya adalah menghubungi penjual via WhatsApp untuk konfirmasi ketersediaan barang dan pengiriman.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Separator />
            <h3 className="font-semibold">Kontak Penjual:</h3>
            <div className="space-y-3">
              {submissionResult.map((msg, index) => (
                <a
                  key={index}
                  href={msg.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button variant="outline" className="w-full justify-between h-auto py-3">
                    <div className="text-left">
                      <p className="font-bold">{msg.sellerName}</p>
                      <p className="text-xs text-muted-foreground">Klik untuk mengirim pesan</p>
                    </div>
                    <MessageSquareShare className="h-5 w-5 text-green-600" />
                  </Button>
                </a>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-4">
             <Separator />
             <Button asChild className="w-full">
                <Link href="/">Kembali ke Halaman Utama</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }


  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold font-headline mb-8 text-center">Checkout</h1>
      <div className="grid md:grid-cols-2 gap-12">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Informasi Pembeli</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Lengkap</FormLabel>
                        <FormControl>
                          <Input placeholder="Nama Anda" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="whatsapp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nomor WhatsApp</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: 6281234567890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" size="lg" className="w-full bg-accent hover:bg-accent/90" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Simpan dan Lanjut ke WhatsApp
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Belanja</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cartItems.map(({ product, quantity }) => (
                  <div key={product.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{quantity} x {formatRupiah(product.price)}</p>
                    </div>
                    <p>{formatRupiah(product.price * quantity)}</p>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <p>Total</p>
                  <p>{formatRupiah(totalPrice)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
