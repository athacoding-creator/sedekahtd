
# Audit Lengkap Website Teras Dakwah

Berikut temuan yang saya dapatkan setelah mengecek seluruh kode, database, dan konfigurasi.

---

## A. FRONTEND (UI/UX)

### 1. Halaman 404 tidak branded
Halaman NotFound menggunakan teks bahasa Inggris ("Oops! Page not found") dan tidak menggunakan Layout Teras Dakwah. Seharusnya konsisten dengan branding.

### 2. Meta OG Image belum ada
`index.html` tidak punya `og:image` — saat link di-share ke WhatsApp/Telegram, tidak muncul gambar preview.

### 3. Share per-campaign tidak dynamic
Karena ini SPA (client-side), scraper WhatsApp/Telegram tidak bisa membaca judul & gambar campaign. Semua link campaign yang di-share akan menampilkan meta generic "Teras Dakwah | Terus Berbagi". Butuh edge function untuk render dynamic OG tags.

### 4. Fallback saat payment methods kosong
Di Donate.tsx, jika campaign tidak punya payment method terhubung, tampilan menunjukkan "QRIS — Yayasan Teras Dakwah" tapi tanpa gambar QRIS yang valid (hanya placeholder). User bisa bingung cara bayar.

### 5. Pesan field opsional hilang di form donasi
Form Donate.tsx tidak ada field "pesan" untuk donatur, padahal kolom `pesan` ada di database dan ditampilkan di halaman Index.

### 6. Kategori hardcoded
Di Index.tsx, filter kategori hardcoded: `["Semua", "Sosial", "Kemanusiaan", "Pembangunan"]`. Jika admin membuat campaign dengan kategori lain, tidak akan muncul di filter.

### 7. Statistik "Jumlah Donasi" hanya max 50
Query `public_donations` di-limit 50, tapi `stats.jumlah` menggunakan `list.length`. Jadi jika donasi > 50, statistik salah. Seharusnya pakai `count: "exact"`.

---

## B. BACKEND / DATABASE

### 8. Trigger `update_campaign_terkumpul` ada tapi tidak ada trigger `updated_at` di campaigns
Trigger `trg_update_terkumpul` berjalan di tabel `donations` (OK). Tapi `update_updated_at_column()` function ada di DB namun tidak ada trigger yang attach ke tabel `campaigns` untuk auto-update `updated_at`.

### 9. Tabel `qris_list` masih ada (unused)
Setelah migrasi ke `payment_methods`, tabel `qris_list` masih ada. Kolom `qris_id` di `campaigns` juga masih ada. Ini dead code — bisa membingungkan.

### 10. Foreign keys tidak ada
Tabel `campaign_payment_methods` tidak punya FK ke `campaigns` atau `payment_methods`. Tabel `donations` tidak punya FK ke `campaigns`. Tabel `campaign_visits` tidak punya FK ke `campaigns`. Ini berarti data orphan bisa terjadi (misal campaign dihapus tapi donasi tetap ada).

### 11. Security: RLS "always true" untuk INSERT
- `donations`: siapa saja bisa INSERT donasi tanpa validasi — ini OK untuk fitur publik, tapi sebaiknya ada rate limiting.
- `campaign_visits`: siapa saja bisa INSERT — OK, tapi bisa di-abuse.

### 12. Security: SECURITY DEFINER functions callable by anon
Fungsi `has_role` dan `sync_campaign_terkumpul` bisa dipanggil oleh user anonim via PostgREST. `sync_campaign_terkumpul` khususnya berbahaya karena bisa digunakan untuk manipulasi field `terkumpul`. Harus revoke EXECUTE dari anon/public.

### 13. Storage buckets allow listing
Bucket `campaigns`, `heroes`, `qris` bersifat public dan mengizinkan listing semua file. Sebaiknya listing di-restrict.

---

## C. SISTEM / INFRASTRUKTUR

### 14. Route `/admin/qris` masih aktif
`AdminQris` page masih terdaftar di App.tsx tapi sudah digantikan oleh `/admin/payments`. Dead route.

### 15. Tidak ada error boundary
Tidak ada React Error Boundary — jika ada crash di runtime, user melihat blank page.

### 16. Tidak ada SEO sitemap atau robots.txt yang lengkap
`robots.txt` ada tapi belum dicek isinya. Belum ada sitemap.xml.

### 17. Leaked password protection disabled
Supabase Auth tidak mengaktifkan perlindungan password bocor.

---

## Rencana Perbaikan (Prioritas)

| # | Task | Prioritas |
|---|------|-----------|
| 1 | Fix statistik donasi (pakai count exact) | Tinggi |
| 2 | Revoke EXECUTE `sync_campaign_terkumpul` dari anon | Tinggi |
| 3 | Tambahkan og:image ke index.html | Sedang |
| 4 | Tambahkan field "pesan" di form Donate | Sedang |
| 5 | Buat halaman 404 branded (bahasa Indonesia + Layout) | Sedang |
| 6 | Hapus route `/admin/qris` (dead code) | Rendah |
| 7 | Buat kategori dinamis dari data campaign | Rendah |
| 8 | Cleanup tabel `qris_list` & kolom `qris_id` | Rendah |
| 9 | Tambah foreign keys di tabel junction | Rendah |
| 10 | Edge function untuk dynamic OG tags per campaign | Opsional |
| 11 | Tambah React Error Boundary | Rendah |

Mau saya kerjakan semua perbaikan di atas, atau pilih yang mana dulu?
