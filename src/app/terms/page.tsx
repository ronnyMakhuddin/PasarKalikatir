import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, FileText, Users } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Syarat dan Ketentuan - Pasar Kalikatir',
  description: 'Syarat dan ketentuan penggunaan platform Pasar Kalikatir.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <FileText className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Syarat dan Ketentuan
          </h1>
          <p className="text-lg text-gray-600">
            Pasar Kalikatir - Platform Marketplace Desa
          </p>
        </div>

        {/* Back Button */}
        <div className="mb-6">
          <Button asChild variant="outline">
            <Link href="/menjadi-pedagang" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Pendaftaran
            </Link>
          </Button>
        </div>

        {/* Terms Content */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Ketentuan Umum
              </CardTitle>
              <CardDescription>
                Terakhir diperbarui: {new Date().toLocaleDateString('id-ID')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <p>
                Selamat datang di Pasar Kalikatir. Dengan menggunakan platform ini, Anda menyetujui untuk mematuhi syarat dan ketentuan yang berlaku.
              </p>
              
              <h3 className="font-semibold text-base mt-6 mb-3">1. Definisi</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Platform:</strong> Website Pasar Kalikatir</li>
                <li><strong>Penjual:</strong> Pedagang yang terdaftar dan menjual produk</li>
                <li><strong>Pembeli:</strong> Konsumen yang membeli produk</li>
                <li><strong>Admin:</strong> Pengelola platform</li>
              </ul>

              <h3 className="font-semibold text-base mt-6 mb-3">2. Pendaftaran Penjual</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Penjual harus memberikan informasi yang akurat dan lengkap</li>
                <li>Dokumen KTP diperlukan untuk verifikasi</li>
                <li>Admin berhak menolak pendaftaran tanpa alasan</li>
                <li>Akun penjual harus diverifikasi oleh admin sebelum aktif</li>
              </ul>

              <h3 className="font-semibold text-base mt-6 mb-3">3. Kewajiban Penjual</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Menjual produk asli dan berkualitas</li>
                <li>Memberikan informasi produk yang akurat</li>
                <li>Menangani pesanan dengan cepat dan profesional</li>
                <li>Mematuhi peraturan yang berlaku</li>
                <li>Tidak menjual produk ilegal atau terlarang</li>
              </ul>

              <h3 className="font-semibold text-base mt-6 mb-3">4. Kewajiban Pembeli</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Memberikan informasi yang akurat saat berbelanja</li>
                <li>Membayar sesuai harga yang disepakati</li>
                <li>Menghormati kesepakatan dengan penjual</li>
                <li>Tidak melakukan penipuan atau kecurangan</li>
              </ul>

              <h3 className="font-semibold text-base mt-6 mb-3">5. Transaksi</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Transaksi dilakukan langsung antara pembeli dan penjual</li>
                <li>Platform tidak bertanggung jawab atas transaksi</li>
                <li>Pembayaran dilakukan melalui WhatsApp sesuai kesepakatan</li>
                <li>Pengiriman dan pengembalian diatur oleh penjual</li>
              </ul>

              <h3 className="font-semibold text-base mt-6 mb-3">6. Privasi dan Keamanan</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Data pribadi akan dijaga kerahasiaannya</li>
                <li>Informasi hanya digunakan untuk keperluan platform</li>
                <li>Tidak akan dibagikan ke pihak ketiga tanpa izin</li>
                <li>Pengguna bertanggung jawab atas keamanan akun</li>
              </ul>

              <h3 className="font-semibold text-base mt-6 mb-3">7. Pembatasan</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Dilarang menggunakan platform untuk kegiatan ilegal</li>
                <li>Dilarang menyalahgunakan informasi pengguna lain</li>
                <li>Dilarang melakukan spam atau gangguan</li>
                <li>Admin berhak membatasi atau menutup akun yang melanggar</li>
              </ul>

              <h3 className="font-semibold text-base mt-6 mb-3">8. Tanggung Jawab</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Platform tidak bertanggung jawab atas kerugian pengguna</li>
                <li>Penjual bertanggung jawab atas produk yang dijual</li>
                <li>Pembeli bertanggung jawab atas pembayaran</li>
                <li>Admin berhak mengambil tindakan terhadap pelanggaran</li>
              </ul>

              <h3 className="font-semibold text-base mt-6 mb-3">9. Perubahan Ketentuan</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Ketentuan dapat berubah sewaktu-waktu</li>
                <li>Perubahan akan diumumkan di platform</li>
                <li>Penggunaan setelah perubahan berarti menyetujui ketentuan baru</li>
              </ul>

              <h3 className="font-semibold text-base mt-6 mb-3">10. Kontak</h3>
              <p>
                Untuk pertanyaan atau keluhan, silakan hubungi admin melalui WhatsApp atau email yang tersedia di platform.
              </p>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                Informasi Kontak
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Email:</strong> admin@pasardesa.com</p>
              <p><strong>WhatsApp:</strong> +62 812-3456-7890</p>
              <p><strong>Alamat:</strong> Desa Kalikatir, Kecamatan Gondang, Kabupaten Mojokerto</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 