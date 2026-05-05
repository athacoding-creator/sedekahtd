# Sedekah Teras Dakwah - Platform Donasi Digital

Platform berbasis web modern yang dirancang untuk memfasilitasi pengelolaan donasi dan kampanye amal bagi **Yayasan Teras Dakwah**. Dibangun dengan teknologi web terbaru untuk memberikan pengalaman donasi yang cepat, aman, dan transparan bagi para "#OrangBaik".



---

## 🚀 Fitur Utama

### Untuk Donatur (Frontend)
- **Dashboard Statistik Real-time**: Menampilkan total donasi terkumpul, jumlah transaksi, dan kampanye aktif menggunakan animasi *CountUp*.
- **Hero Carousel Dinamis**: Banner informasi program utama yang dapat dikelola melalui admin.
- **Pencarian & Filter Kampanye**: Cari program berdasarkan judul atau kategori secara instan.
- **Program Pilihan**: Slider khusus untuk kampanye prioritas yang membutuhkan bantuan segera.
- **Riwayat Donasi Publik**: Daftar transparan para donatur terbaru (Orang-orang Baik) beserta pesan-pesan mereka.
- **Formulir Donasi Mudah**: Proses donasi yang disederhanakan dengan integrasi WhatsApp untuk konfirmasi manual atau sistem pembayaran yang tersedia.

### Untuk Pengelola (Panel Admin)
- **Manajemen Kampanye**: Buat, edit, hapus, dan tandai kampanye sebagai "Program Pilihan".
- **Verifikasi Donasi**: Sistem kontrol untuk memverifikasi masuknya dana sebelum ditampilkan ke publik.
- **Analitik Kampanye**: Pantau performa setiap program melalui grafik interaktif (Recharts).
- **Pengaturan Situs**: Kelola banner hero, informasi yayasan, dan QRIS pembayaran langsung dari dashboard.

---

## 🛠️ Tech Stack

- **Framework**: [React.js 18](https://reactjs.org/) (dengan TypeScript)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Backend/Database**: [Supabase](https://supabase.com/) (PostgreSQL & Real-time Subscriptions)
- **State Management & Data Fetching**: TanStack Query (React Query) v5
- **Icons & Animations**: Lucide React & Tailwind-animate
- **Testing**: Vitest & Testing Library

---

## 📂 Struktur Folder Utama

```text
├── src/
│   ├── assets/          # Gambar, logo, dan file statis
│   ├── components/      # Komponen UI reusable (Button, Card, Layout, dll)
│   ├── hooks/           # Custom React hooks (e.g., use-mobile, use-toast)
│   ├── integrations/    # Konfigurasi Supabase client
│   ├── lib/             # Utility functions (formatter rupiah, tracking)
│   └── pages/           # Halaman utama (Index, Admin, Campaign Detail, dll)
├── supabase/
│   ├── migrations/      # Skema database (SQL)
│   └── functions/       # Edge Functions (Keep-alive)
└── public/              # Aset publik seperti favicon
