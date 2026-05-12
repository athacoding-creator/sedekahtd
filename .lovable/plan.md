## Tujuan
1. **Stats homepage bisa "dipoles"** — admin tambah offset agar tidak terlihat sepi.
2. **Template WA admin** support variabel `{panggilan}` (Bapak/Ibu/Kak).
3. **Tombol "Sedekah Sekarang" per-campaign** — admin atur teks & warna sendiri.

---

## 1. Stats Offset (Homepage)

**Database** — pakai tabel `site_settings` yang sudah ada (key/value), tambah 3 key:
- `stats_offset_total` — angka rupiah yang ditambahkan ke "Total Donasi"
- `stats_offset_jumlah` — angka yang ditambahkan ke "Jumlah Donasi"
- `stats_offset_aktif` — angka yang ditambahkan ke "Aktif Program"

**Admin Settings** (`AdminSettings.tsx`) — tambah section "Boost Stats Homepage":
- 3 input number untuk masing-masing offset
- Penjelasan: "Angka ini akan **ditambahkan** ke hitungan asli untuk ditampilkan di homepage"
- Tombol Simpan

**Frontend** (`Index.tsx`):
- Fetch 3 setting di awal
- Saat render stats: `stats.total + offset_total`, `stats.jumlah + offset_jumlah`, `stats.aktif + offset_aktif`
- CountUp tetap animasi naik ke nilai akhir

---

## 2. Template WA dengan {panggilan}

**Update `whatsapp.ts`**:
- Default template confirm & thank-you ditambah `{panggilan}`:
  ```
  Halo {panggilan} {nama}, terima kasih atas donasi ...
  ```
- `buildWaConfirmUrl` & helper terima param `panggilan`, isi otomatis ke variable.

**Update `Donate.tsx`**:
- Saat panggil `buildWaConfirmUrl`, kirim `panggilan` terpisah (bukan digabung di nama lagi).
- Insert ke `donations.nama`: tetap simpan "Bapak Budi" (kompatibel data lama).

**Update `AdminSettings.tsx`**:
- Di editor template, tampilkan daftar variable yang tersedia, sekarang termasuk `{panggilan}`.

**Update `AdminDonations.tsx`** (template thank-you):
- Saat kirim WA terima kasih ke donatur, parse panggilan dari nama (kata pertama bila Bapak/Ibu/Kak), kirim sebagai `{panggilan}` dan sisanya sebagai `{nama}`.

---

## 3. Tombol Donasi per-Campaign

**Database** — tambah 2 kolom ke `campaigns`:
- `tombol_teks` text nullable (default null → fallback ke "Sedekah Sekarang")
- `tombol_warna` text nullable (hex, default null → fallback ke warna primary)

**Admin Campaigns** (`AdminCampaigns.tsx`) — di form edit/tambah campaign:
- Field "Teks Tombol Donasi" (input text, placeholder "Sedekah Sekarang")
- Field "Warna Tombol" (color picker / input hex)
- Preview tombol kecil di samping field

**Frontend**:
- `CampaignDetail.tsx`: tombol "Sedekah Sekarang" pakai `c.tombol_teks ?? "Sedekah Sekarang"` dan `style={{ backgroundColor: c.tombol_warna }}` bila ada (jika tidak, kelas Tailwind primary).
- (Opsional) Hero CTA di Index tetap default global, tidak per-campaign — karena hero terpisah dari campaign.

---

## Files yang berubah
- migration baru: tambah kolom `campaigns.tombol_teks`, `campaigns.tombol_warna`
- `src/lib/whatsapp.ts` — variable `{panggilan}`
- `src/pages/Donate.tsx` — kirim panggilan terpisah ke WA
- `src/pages/AdminSettings.tsx` — section Boost Stats + dokumentasi variable WA
- `src/pages/AdminDonations.tsx` — parse panggilan dari nama saat kirim thank-you
- `src/pages/AdminCampaigns.tsx` — field teks & warna tombol
- `src/pages/CampaignDetail.tsx` — render tombol pakai setting campaign
- `src/pages/Index.tsx` — terapkan offset stats
- `src/components/CampaignCard.tsx` — type `Campaign` tambah `tombol_teks`, `tombol_warna`

---

## Catatan
- Offset hanya **angka tampilan**; data donasi asli tidak diubah.
- Bila admin set offset=0, stats tampil apa adanya seperti sekarang.
- Warna tombol kosong = pakai warna primary default (tidak memaksa admin isi).
