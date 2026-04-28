# Rencana: Analytics per Campaign + FB Pixel per Campaign

Ya, semuanya bisa diimplementasikan. Berikut rencananya.

## 1. Database (migrasi baru)

**Tambah kolom di `campaigns`:**
- `fb_pixel_id` (text, nullable) — ID FB Pixel khusus campaign tsb

**Tabel baru `campaign_visits`** untuk tracking kunjungan:
- `id` uuid PK
- `campaign_id` uuid → campaigns
- `visitor_id` text (anonim, disimpan di localStorage)
- `ip_hash` text (nullable)
- `user_agent` text
- `referrer` text
- `created_at` timestamptz

RLS:
- Public boleh INSERT (tracking dari browser)
- Hanya admin boleh SELECT (data analytics)

Index pada `campaign_id, created_at` untuk query cepat.

## 2. Tracking Otomatis di Halaman Campaign

Di `CampaignDetail.tsx`:
- Saat halaman dibuka → INSERT 1 baris ke `campaign_visits` (dengan visitor_id dari localStorage agar bisa hitung unique vs total).
- Inject FB Pixel script dinamis berdasarkan `campaign.fb_pixel_id` (jika ada). Fire event `PageView` saat masuk, `Lead`/`InitiateCheckout` saat klik "Sedekah Sekarang".
- Di `Donate.tsx` → fire `Purchase` setelah submit donasi.

FB Pixel di-load via `<script>` injection di `useEffect`, di-cleanup saat unmount supaya pixel beda campaign tidak bocor.

## 3. Halaman Admin Analytics per Campaign

**Route baru:** `/admin/campaigns/:id/analytics`

Diakses via tombol "Lihat Analytics" pada tiap row di `AdminCampaigns`.

Konten halaman (mirip screenshot referensi):

- **Header:** thumbnail + judul campaign
- **Stat cards:**
  - Total Kunjungan (count `campaign_visits`)
  - Total Donatur (unique nama dari `donations` verified)
  - Mengisi Data (count `donations` semua status)
  - Jumlah Transaksi (count `donations` verified)
  - Jumlah Donasi (sum nominal verified) → format Rupiah
  - Persentase Donasi (verified / pengisi data × 100%)
- **Chart 1 — Total donasi per hari** (count transaksi per tanggal): line chart pakai `recharts` (sudah tersedia).
- **Chart 2 — Jumlah donasi per hari** (sum nominal per tanggal): line chart.
- **Filter rentang tanggal** (default 30 hari terakhir).
- **Tabel donatur** untuk campaign ini: tanggal, nama, nominal, status.
- Realtime subscribe ke `donations` & `campaign_visits` untuk auto-refresh.

## 4. Form CRUD Campaign

Di `AdminCampaigns.tsx` form edit/create → tambah field input **"Facebook Pixel ID"** (opsional). Helper text: "Kosongkan jika tidak pakai pixel khusus."

## 5. Catatan Teknis

- FB Pixel ID disimpan plain text di DB (bukan secret) — memang aman karena pixel ID public.
- `visitor_id` digenerate di client (`crypto.randomUUID()`) lalu disimpan di `localStorage` agar repeat-visit bisa dideteksi.
- Tracking visit hanya fire 1x per session per campaign (pakai `sessionStorage` flag) agar tidak inflate karena re-render.
- Library chart: `recharts` (sudah ada di shadcn `chart.tsx`).

## File yang akan dibuat/diubah

**Baru:**
- `src/pages/AdminCampaignAnalytics.tsx`
- `src/lib/tracking.ts` (helper visit + FB Pixel inject)

**Diubah:**
- `src/App.tsx` — route analytics
- `src/pages/CampaignDetail.tsx` — fire visit + load pixel
- `src/pages/Donate.tsx` — fire FB Pixel Purchase event
- `src/pages/AdminCampaigns.tsx` — input FB Pixel ID + tombol Analytics

**Migrasi DB:**
- ALTER `campaigns` add `fb_pixel_id`
- CREATE `campaign_visits` + RLS + index

Setujui untuk saya mulai implementasi?
