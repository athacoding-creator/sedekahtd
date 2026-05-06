
## Rencana: Template Pesan WhatsApp di Admin Settings

### Apa yang akan dibuat

Menambahkan section baru di halaman **Admin Settings** untuk mengedit 2 template pesan WhatsApp:

1. **Pesan Konfirmasi Donatur** — pesan yang dikirim donatur ke admin setelah transfer (dipakai di halaman Donate)
2. **Pesan Terima Kasih Admin** — pesan balasan admin ke donatur (dipakai di tombol WA di halaman Admin Donasi)

Template mendukung **variabel placeholder** seperti `{nama}`, `{nominal}`, `{campaign}` yang otomatis diganti saat pesan dikirim.

### Perubahan

**1. Admin Settings (`src/pages/AdminSettings.tsx`)**
- Tambah card baru "Template Pesan WhatsApp" dengan 2 textarea:
  - `wa_template_confirm` — template konfirmasi donatur
  - `wa_template_thankyou` — template terima kasih admin
- Tampilkan daftar variabel yang tersedia: `{nama}`, `{nominal}`, `{campaign}`
- Default value sudah terisi pesan yang sama seperti sekarang
- Simpan ke tabel `site_settings` via upsert (tabel sudah ada, tidak perlu migrasi)

**2. WhatsApp helper (`src/lib/whatsapp.ts`)**
- Tambah fungsi `buildFromTemplate(template, vars)` yang mengganti placeholder dengan nilai aktual
- Update `buildWaConfirmUrl` agar menerima parameter template opsional

**3. Halaman Donate (`src/pages/Donate.tsx`)**
- Fetch template `wa_template_confirm` dari `site_settings` saat load
- Gunakan template tersebut (atau fallback ke default) saat membangun URL WA

**4. Admin Donasi (`src/pages/AdminDonations.tsx`)**
- Fetch template `wa_template_thankyou` dari `site_settings` saat load
- Gunakan template tersebut di fungsi `openWa`

### Detail Teknis

- Tidak perlu migrasi database — data disimpan di `site_settings` yang sudah ada
- Key yang digunakan: `wa_template_confirm`, `wa_template_thankyou`
- Default templates:
  - Confirm: `Assalamu'alaikum Admin Teras Dakwah,\n\nSaya sudah melakukan transfer donasi:\n• Nama: {nama}\n• Nominal: Rp {nominal}\n• Campaign: {campaign}\n\nBerikut saya kirim bukti transfernya. Mohon konfirmasinya, jazakumullah khairan.`
  - Thank you: `Halo {nama}, terima kasih atas donasi sebesar Rp {nominal} untuk {campaign}. Jazakallahu khairan 🙏`
