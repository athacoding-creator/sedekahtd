## Tujuan
Tampilkan jumlah donatur di setiap card campaign, dan urutkan daftar campaign: **Pilihan dulu, lalu yang paling banyak donaturnya**.

## Perubahan Database
Tambah kolom hitungan donatur agar query cepat (tanpa harus count tiap render):

- `campaigns.jumlah_donatur` (integer, default 0) — diisi otomatis dari donasi berstatus `verified`.
- Update trigger `update_campaign_terkumpul` agar saat donasi jadi `verified` / batal verified, kolom `jumlah_donatur` ikut +1 / -1.
- Update fungsi `sync_campaign_terkumpul` agar sekalian recompute `jumlah_donatur = COUNT(donations verified)`.
- Backfill: isi `jumlah_donatur` semua campaign dari data donasi terverifikasi yang sudah ada.

## Perubahan Frontend

**1. Card campaign (`CampaignCard.tsx`)**
Tambah baris kecil di bawah nominal terkumpul:
```
👥 152 Donatur     ∞ hari lagi (opsional, skip dulu)
```
- Tampil ikon `Users` + angka + label "Donatur".
- Hanya tampil bila `jumlah_donatur > 0` (kalau 0, sembunyikan biar tidak terlihat sepi).

**2. Urutan di `CampaignList.tsx` & `Index.tsx` (homepage)**
Ganti `.order("created_at", desc)` jadi:
```ts
.order("is_pilihan", { ascending: false })
.order("jumlah_donatur", { ascending: false })
.order("created_at", { ascending: false })  // tie-breaker
```
Hasil: campaign Pilihan selalu di atas, lalu sisanya diurut dari donatur terbanyak.

**3. Type update**
Tambah `jumlah_donatur?: number` di type `Campaign` (`CampaignCard.tsx`).

## Catatan
- Hitungan donatur = jumlah baris donasi `status='verified'` per campaign (1 donasi = 1 donatur, sesuai pilihan Anda).
- Di Admin Donations yang sudah verifikasi/un-verifikasi donasi, angka donatur otomatis ikut update via trigger — realtime tanpa perlu refresh manual.
- Halaman admin lain (AdminCampaigns) tidak perlu diubah; field `is_pilihan` yang sudah ada tetap dipakai untuk pin ke atas.

## Files
- migration baru (alter table + update function + update trigger + backfill)
- `src/components/CampaignCard.tsx` — tampilkan jumlah donatur
- `src/pages/CampaignList.tsx` — ubah order
- `src/pages/Index.tsx` — ubah order (kalau ada list campaign di homepage)
