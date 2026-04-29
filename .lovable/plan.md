# Rencana Perbaikan & Pengembangan

Tiga hal akan dikerjakan:

## 1. Tombol "Bagikan" di Halaman Detail Campaign
**Masalah:** Tombolnya ada tapi tidak melakukan apapun (tidak ada `onClick`).

**Solusi:**
- Pakai Web Share API (`navigator.share`) jika tersedia (otomatis muncul di mobile: WhatsApp, IG, Telegram, dll).
- Fallback otomatis ke copy link ke clipboard + tampil toast "Link disalin" jika perangkat tidak mendukung share native (mis. desktop Chrome).
- Konten share: judul campaign + URL halaman.

## 2. Tabel Donasi Overflow di Mobile (Admin)
**Masalah:** Pada layar HP, area tabel di `/admin/donations` melebar ke kanan dan ikut menggeser layout lain.

**Solusi:**
- Bungkus container tabel dengan `min-w-0` + `max-w-full` agar `overflow-x-auto` benar-benar bekerja.
- Pastikan parent (`AdminLayout > main`) tidak memaksa lebar minimum.
- Tetap bisa di-scroll horizontal di dalam card-nya saja, tidak menggeser halaman.

## 3. "Kelola QRIS" → "Kelola Pembayaran" (Multi-Metode)
Sekarang campaign hanya bisa pakai 1 QRIS. Akan diubah jadi sistem **metode pembayaran** yang fleksibel.

### Perubahan Database
- Buat tabel baru `payment_methods` menggantikan peran `qris_list`:
  - `nama` (mis. "QRIS Yayasan", "BSI 7012345678", "GoPay 0853xxx")
  - `tipe` — pilihan: `qris`, `bank_transfer`, `gopay`, `shopeepay`, `dana`, `ovo`, `lainnya`
  - `nomor_rekening` (untuk transfer bank / e-wallet, opsional)
  - `nama_pemilik` (atas nama, opsional)
  - `gambar_url` (untuk QRIS, opsional untuk yang lain)
  - `deskripsi`, `aktif`, `urutan`
- Tabel jembatan `campaign_payment_methods` (campaign_id, payment_method_id) → 1 campaign bisa pakai BANYAK metode.
- Migrasi data lama dari `qris_list` ke `payment_methods` (tipe `qris`) dan `campaigns.qris_id` lama ke tabel jembatan otomatis, supaya tidak ada data hilang.
- RLS: publik bisa baca metode aktif, hanya admin bisa kelola.

### Perubahan Admin
- **Menu sidebar:** "Kelola QRIS" → **"Kelola Pembayaran"** (route `/admin/payments`).
- **Halaman baru `AdminPayments.tsx`:**
  - Tab/filter berdasar tipe (Semua / QRIS / Bank / E-wallet).
  - Form tambah/edit dinamis sesuai tipe:
    - Tipe **QRIS** → wajib upload gambar.
    - Tipe **Bank/E-wallet** → wajib nomor rekening + atas nama, gambar opsional (logo).
  - Toggle aktif/nonaktif, urutan, hapus (dengan pengecekan apakah dipakai campaign).
- **`AdminCampaigns.tsx`:** dropdown QRIS tunggal diganti **multi-select metode pembayaran** dengan checklist (QRIS Yayasan ☑, BSI ☑, GoPay ☐, …).

### Perubahan Donatur
- **`Donate.tsx`:** donatur memilih dari **daftar metode pembayaran yang diaktifkan campaign** (cards dengan icon per tipe).
  - Klik QRIS → tampil gambar QR untuk discan.
  - Klik Bank/E-wallet → tampil nomor rekening + tombol "Salin Nomor" + atas nama.
  - Lalu lanjut ke step upload bukti seperti sekarang.
- Field `metode_pembayaran` di donations diisi otomatis sesuai pilihan (mis. `BSI - 7012345678 a.n. Yayasan Teras Dakwah`).

## Detail Teknis (Singkat)

```text
payment_methods
 ├─ id, nama, tipe, nomor_rekening?, nama_pemilik?
 ├─ gambar_url?, deskripsi?, aktif, urutan
campaign_payment_methods (junction)
 ├─ campaign_id, payment_method_id
```

File yang akan dibuat/diubah:
- **Baru:** `src/pages/AdminPayments.tsx`
- **Diubah:** `src/App.tsx` (route + redirect /admin/qris → /admin/payments), `src/pages/Admin.tsx` (label menu), `src/pages/AdminCampaigns.tsx` (multi-select), `src/pages/Donate.tsx` (pilih metode), `src/pages/CampaignDetail.tsx` (Bagikan), `src/pages/AdminDonations.tsx` (fix overflow mobile).
- **Migrasi DB:** buat 2 tabel baru, copy data dari `qris_list`, RLS policies. `qris_list` lama tetap dipertahankan dulu (read-only) supaya aman, bisa dihapus belakangan.

Setujui untuk saya mulai implementasi?