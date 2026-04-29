import { AdminLayout } from "@/components/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload, Loader2, X, Eye, EyeOff, CheckCircle2, QrCode, Landmark, Wallet, CreditCard } from "lucide-react";

type PaymentType = "qris" | "bank_transfer" | "gopay" | "shopeepay" | "dana" | "ovo" | "lainnya";

type PaymentMethod = {
  id: string;
  nama: string;
  tipe: PaymentType;
  nomor_rekening: string | null;
  nama_pemilik: string | null;
  gambar_url: string | null;
  deskripsi: string | null;
  aktif: boolean;
  urutan: number;
  created_at: string;
};

const TYPE_OPTIONS: { value: PaymentType; label: string; icon: typeof QrCode }[] = [
  { value: "qris", label: "QRIS", icon: QrCode },
  { value: "bank_transfer", label: "Transfer Bank (BSI, BCA, dll)", icon: Landmark },
  { value: "gopay", label: "GoPay", icon: Wallet },
  { value: "shopeepay", label: "ShopeePay", icon: Wallet },
  { value: "dana", label: "DANA", icon: Wallet },
  { value: "ovo", label: "OVO", icon: Wallet },
  { value: "lainnya", label: "Lainnya", icon: CreditCard },
];

const typeIcon = (t: PaymentType) => TYPE_OPTIONS.find(o => o.value === t)?.icon ?? CreditCard;
const typeLabel = (t: PaymentType) => TYPE_OPTIONS.find(o => o.value === t)?.label ?? t;
const isQris = (t: PaymentType) => t === "qris";

const empty = {
  nama: "",
  tipe: "qris" as PaymentType,
  nomor_rekening: "",
  nama_pemilik: "",
  gambar_url: "",
  deskripsi: "",
  aktif: true,
  urutan: 0,
};

const AdminPayments = () => {
  const [items, setItems] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | PaymentType>("all");

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("payment_methods")
      .select("*")
      .order("urutan", { ascending: true })
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) toast.error(error.message);
    else setItems((data as PaymentMethod[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...empty });
    setFile(null);
    setPreview(null);
    setOpen(true);
  };

  const openEdit = (p: PaymentMethod) => {
    setEditing(p);
    setForm({
      nama: p.nama,
      tipe: p.tipe,
      nomor_rekening: p.nomor_rekening ?? "",
      nama_pemilik: p.nama_pemilik ?? "",
      gambar_url: p.gambar_url ?? "",
      deskripsi: p.deskripsi ?? "",
      aktif: p.aktif,
      urutan: p.urutan,
    });
    setFile(null);
    setPreview(null);
    setOpen(true);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast.error("Maks 5MB"); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!file) return form.gambar_url || null;
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("qris").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("qris").getPublicUrl(path);
    return data.publicUrl;
  };

  const save = async () => {
    if (!form.nama.trim()) { toast.error("Nama wajib diisi"); return; }
    if (isQris(form.tipe) && !file && !form.gambar_url.trim()) {
      toast.error("Gambar QRIS wajib diisi"); return;
    }
    if (!isQris(form.tipe) && !form.nomor_rekening.trim()) {
      toast.error("Nomor rekening / nomor tujuan wajib diisi"); return;
    }

    setSaving(true);
    try {
      const gambar_url = await uploadImage();
      const payload = {
        nama: form.nama.trim(),
        tipe: form.tipe,
        nomor_rekening: form.nomor_rekening.trim() || null,
        nama_pemilik: form.nama_pemilik.trim() || null,
        gambar_url,
        deskripsi: form.deskripsi.trim() || null,
        aktif: form.aktif,
        urutan: Number(form.urutan) || 0,
      };

      if (editing) {
        const { error } = await (supabase as any).from("payment_methods").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Metode pembayaran diperbarui");
      } else {
        const { error } = await (supabase as any).from("payment_methods").insert(payload);
        if (error) throw error;
        toast.success("Metode pembayaran ditambahkan");
      }
      setOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: PaymentMethod) => {
    const { count } = await (supabase as any)
      .from("campaign_payment_methods")
      .select("id", { count: "exact", head: true })
      .eq("payment_method_id", p.id);

    if (count && count > 0) {
      toast.error(`Metode ini dipakai oleh ${count} campaign. Lepaskan dari campaign dulu.`);
      return;
    }
    if (!confirm(`Hapus metode pembayaran "${p.nama}"?`)) return;

    if (p.gambar_url && p.gambar_url.includes("/qris/")) {
      const path = p.gambar_url.split("/qris/").pop();
      if (path) await supabase.storage.from("qris").remove([path]);
    }

    const { error } = await (supabase as any).from("payment_methods").delete().eq("id", p.id);
    if (error) toast.error(error.message);
    else { toast.success("Metode dihapus"); load(); }
  };

  const toggleAktif = async (p: PaymentMethod) => {
    const { error } = await (supabase as any).from("payment_methods").update({ aktif: !p.aktif }).eq("id", p.id);
    if (error) toast.error(error.message);
    else { toast.success(p.aktif ? "Dinonaktifkan" : "Diaktifkan"); load(); }
  };

  const filtered = filter === "all" ? items : items.filter(i => i.tipe === filter);

  return (
    <AdminLayout
      title="Kelola Pembayaran"
      subtitle="Kelola berbagai metode pembayaran: QRIS, Transfer Bank, GoPay, ShopeePay, dll"
      back={{ to: "/admin", label: "Kembali ke Dashboard" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-1.5">
          <FilterPill active={filter === "all"} onClick={() => setFilter("all")}>Semua ({items.length})</FilterPill>
          {TYPE_OPTIONS.map(o => {
            const c = items.filter(i => i.tipe === o.value).length;
            if (c === 0 && filter !== o.value) return null;
            return (
              <FilterPill key={o.value} active={filter === o.value} onClick={() => setFilter(o.value)}>
                {o.label.split(" ")[0]} ({c})
              </FilterPill>
            );
          })}
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow-button hover:scale-[1.02] transition-smooth"
        >
          <Plus className="h-4 w-4" /> Tambah Metode
        </button>
      </div>

      {loading && (
        <div className="py-16 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="py-16 text-center text-muted-foreground bg-card rounded-2xl border border-dashed border-border">
          Belum ada metode pembayaran. Klik <strong>Tambah Metode</strong> untuk mulai.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => {
          const Icon = typeIcon(p.tipe);
          return (
            <div key={p.id} className={`bg-card rounded-2xl border p-4 shadow-soft transition-smooth ${p.aktif ? "border-border" : "border-dashed border-border opacity-70"}`}>
              <div className="flex items-start gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold truncate">{p.nama}</div>
                  <div className="text-xs text-muted-foreground">{typeLabel(p.tipe)}</div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.aktif ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                  {p.aktif ? "AKTIF" : "OFF"}
                </span>
              </div>

              {isQris(p.tipe) && p.gambar_url && (
                <div className="bg-white rounded-xl border border-border p-2 mb-3">
                  <img src={p.gambar_url} alt={p.nama} className="w-full max-h-40 object-contain mx-auto" />
                </div>
              )}

              {!isQris(p.tipe) && (
                <div className="space-y-1 mb-3 p-3 rounded-xl bg-muted/40 border border-border text-sm">
                  {p.nomor_rekening && (
                    <div><span className="text-xs text-muted-foreground">Nomor:</span> <span className="font-mono font-bold">{p.nomor_rekening}</span></div>
                  )}
                  {p.nama_pemilik && (
                    <div className="text-xs text-muted-foreground">a.n. {p.nama_pemilik}</div>
                  )}
                </div>
              )}

              {p.deskripsi && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{p.deskripsi}</p>}

              <div className="flex items-center justify-between gap-1">
                <button onClick={() => toggleAktif(p)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-smooth" title={p.aktif ? "Nonaktifkan" : "Aktifkan"}>
                  {p.aktif ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-smooth" title="Edit">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => remove(p)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-smooth" title="Hapus">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setOpen(false)}>
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-lg my-8 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="font-display font-bold text-lg">{editing ? "Edit Metode Pembayaran" : "Tambah Metode Pembayaran"}</h2>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-5 space-y-4">
              <Field label="Tipe Pembayaran *">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TYPE_OPTIONS.map(o => {
                    const Icon = o.icon;
                    const active = form.tipe === o.value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setForm({ ...form, tipe: o.value })}
                        className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border-2 transition-smooth text-xs font-bold ${
                          active ? "border-primary bg-primary/5 text-primary" : "border-border bg-background text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="truncate w-full text-center">{o.label.split(" ")[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field label="Nama / Label *">
                <input
                  value={form.nama}
                  onChange={e => setForm({ ...form, nama: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-background border border-border focus:border-primary focus:outline-none"
                  placeholder={isQris(form.tipe) ? "QRIS Yayasan Teras Dakwah" : form.tipe === "bank_transfer" ? "Bank BSI" : `${typeLabel(form.tipe)}`}
                />
              </Field>

              {!isQris(form.tipe) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Nomor Rekening / Nomor HP *">
                    <input
                      value={form.nomor_rekening}
                      onChange={e => setForm({ ...form, nomor_rekening: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-background border border-border focus:border-primary focus:outline-none font-mono"
                      placeholder={form.tipe === "bank_transfer" ? "7012345678" : "081234567890"}
                    />
                  </Field>
                  <Field label="Atas Nama">
                    <input
                      value={form.nama_pemilik}
                      onChange={e => setForm({ ...form, nama_pemilik: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-background border border-border focus:border-primary focus:outline-none"
                      placeholder="Yayasan Teras Dakwah"
                    />
                  </Field>
                </div>
              )}

              <Field label={isQris(form.tipe) ? "Gambar QRIS *" : "Logo / Gambar (opsional)"}>
                <div className="flex items-start gap-3">
                  {(preview || form.gambar_url) && (
                    <img src={preview || form.gambar_url} alt="" className="h-20 w-20 object-contain rounded-lg border border-border bg-white p-1" />
                  )}
                  <label className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-secondary hover:bg-secondary/80 cursor-pointer text-sm font-semibold transition-smooth">
                    <Upload className="h-4 w-4" />
                    {file || form.gambar_url ? "Ganti Gambar" : "Upload Gambar"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
                  </label>
                </div>
                <p className="text-xs text-muted-foreground mt-1">PNG/JPG, maks 5MB</p>
              </Field>

              <Field label="Deskripsi (opsional)">
                <textarea
                  value={form.deskripsi}
                  onChange={e => setForm({ ...form, deskripsi: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-lg bg-background border border-border focus:border-primary focus:outline-none resize-none text-sm"
                  placeholder="Keterangan tambahan untuk donatur"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Urutan">
                  <input
                    type="number"
                    value={form.urutan}
                    onChange={e => setForm({ ...form, urutan: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-lg bg-background border border-border focus:border-primary focus:outline-none"
                  />
                </Field>
                <Field label="Status">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, aktif: !form.aktif })}
                    className={`w-full px-3 py-2.5 rounded-lg border-2 font-bold text-sm transition-smooth ${
                      form.aktif ? "border-green-400 bg-green-50 text-green-700" : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    {form.aktif ? "Aktif" : "Nonaktif"}
                  </button>
                </Field>
              </div>
            </div>

            <div className="p-5 border-t border-border flex gap-2 sticky bottom-0 bg-card">
              <button onClick={() => setOpen(false)} className="flex-1 px-4 py-2.5 rounded-lg bg-secondary hover:bg-secondary/80 font-bold text-sm transition-smooth">
                Batal
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow-button disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {editing ? "Simpan Perubahan" : "Tambahkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide text-muted-foreground">{label}</label>
    {children}
  </div>
);

const FilterPill = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-smooth ${
      active ? "bg-primary text-primary-foreground shadow-button" : "bg-secondary text-foreground hover:bg-secondary/80"
    }`}
  >
    {children}
  </button>
);

export default AdminPayments;
