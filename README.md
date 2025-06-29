# Pasar Desa Kalikatir

Platform e-commerce untuk produk lokal dan kerajinan warga desa Kalikatir.

## Fitur

### 🔐 **Sistem Autentikasi Firebase**
- **Admin**: Verifikasi penjual, kelola dashboard
- **Penjual**: Kelola produk, lihat statistik penjualan
- **Pembeli**: Tidak perlu login, belanja langsung via WhatsApp

### 🛍️ **Fitur Pembeli**
- Katalog produk dengan pencarian dan filter kategori
- Detail produk lengkap
- Keranjang belanja
- Checkout via WhatsApp

### 👨‍💼 **Dashboard Admin**
- Verifikasi penjual baru
- Kelola daftar penjual
- Statistik platform
- Monitoring produk

### 🏪 **Dashboard Penjual**
- Kelola produk (CRUD)
- Update stok
- Lihat statistik penjualan
- Upload gambar produk

## Teknologi

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Database**: Firestore (NoSQL)
- **Deployment**: Vercel (recommended)

## Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd desaMart-kalikatir
npm install
```

### 2. Setup Firebase
1. Buat project di [Firebase Console](https://console.firebase.google.com/)
2. Aktifkan Authentication (Email/Password)
3. Buat Firestore Database
4. Aktifkan Storage (opsional)
5. Copy konfigurasi ke `.env.local`

### 3. Environment Variables
Buat file `.env.local`:
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
```

### 4. Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null && (request.auth.uid == userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null && (
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'seller' ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
    }
  }
}
```

### 5. Jalankan Development Server
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## Struktur Database

### Users Collection
```javascript
{
  uid: "user_id",
  email: "user@example.com",
  role: "admin" | "seller" | "buyer",
  name: "Nama Lengkap",
  phone: "08123456789",
  address: "Alamat lengkap",
  isVerified: true/false,
  createdAt: timestamp
}
```

### Products Collection
```javascript
{
  id: "product_id",
  name: "Nama Produk",
  price: 50000,
  stock: 10,
  description: "Deskripsi produk",
  image: "url_gambar",
  category: "Kategori",
  sellerId: "user_id",
  sellerName: "Nama Penjual",
  isActive: true/false,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Testing

1. **Register Admin**: `/register` → Pilih role "Admin"
2. **Register Seller**: `/register` → Pilih role "Penjual"
3. **Login Admin**: `/login` → Verifikasi penjual di dashboard
4. **Login Seller**: `/login` → Kelola produk
5. **Test Pembeli**: Buka homepage tanpa login

## Deployment

### Vercel (Recommended)
1. Push ke GitHub
2. Connect repository di Vercel
3. Set environment variables
4. Deploy

### Manual Build
```bash
npm run build
npm start
```

## Kontribusi

1. Fork repository
2. Buat feature branch
3. Commit changes
4. Push ke branch
5. Buat Pull Request

## License

MIT License - lihat file LICENSE untuk detail.
