import { AdminLayout } from "@/components/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload, Loader2, X, QrCode, Eye, EyeOff, CheckCircle2 } from "lucide-react";

type Qris = {
  id: string;
  nama: string;
  deskripsi: string | null;
  gambar_url: string;
  aktif: boolean;
  created_at: string;
};

const empty = { nama: "", deskripsi: "", gambar_url: "", aktif: true };

const AdminQris = () => {
  const [items, setItems] = useState<Qris[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Qris | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("qris_list")
      .select("*")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) toast.error(error.message);
    else setItems((data as Qris[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...empty });
    setFile(null);
    setPreview(null);
    setOpen(true);
  };

  const openEdit = (q: Qris) => {
    setEditing(q);
    setForm({
      nama: q.nama,
      deskripsi: q.deskripsi ?? "",
      gambar_url: q.gambar_url,
      aktif: q.aktif,
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

  const uploadImage = async (): Promise<string> => {
    if (!file) return form.gambar_url;
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("qris").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("qris").getPublicUrl(path);
    return data.publicUrl;
  };

  const save = async () => {
    if (!form.nama.trim()) { toast.error("Nama QRIS wajib diisi"); return; }
    if (!file && !form.gambar_url.trim()) { toast.error("Gambar QRIS wajib diisi"); return; }

    setSaving(true);
    try {
      const gambar_url = await uploadImage();
      const payload = {
        nama: form.nama.trim(),
        deskripsi: form.deskripsi.trim() || null,
        gambar_url,
        aktif: form.aktif,
      };

      if (editing) {
        const { error } = await (supabase as any).from("qris_list").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("QRIS diperbarui");
      } else {
        const { error } = await (supabase as any).from("qris_list").insert(payload);
        if (error) throw error;
        toast.success("QRIS ditambahkan");
      }
      setOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (q: Qris) => {
    // Cek apakah QRIS ini dipakai di campaign
    const { count } = await supabase
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("qris_id", q.id);

    if (count && count > 0) {
      toast.error(`QRIS ini digunakan oleh ${count} campaign. Ganti QRIS campaign terlebih dahulu.`);
      return;
    }

    if (!confirm(`Hapus QRIS "${q.nama}"?`)) return;

    // Delete image from storage if it's from our bucket
    if (q.gambar_url.includes("supabase") && q.gambar_url.includes("/qris/")) {
      const path = q.gambar_url.split("/qris/").pop();
      if (path) await supabase.storage.from("qris").remove([path]);
    }

    const { error } = await (supabase as any).from("qris_list").delete().eq("id", q.id);
    if (error) toast.error(error.message);
    else { toast.success("QRIS dihapus"); load(); }
  };

  const toggleAktif = async (q: Qris) => {
    const { error } = await (supabase as any).from("qris_list").update({ aktif: !q.aktif }).eq("id", q.id);
    if (error) toast.error(error.message);
    else {
      toast.success(q.aktif ? "QRIS dinonaktifkan" : "QRIS diaktifkan");
      load();
    }
  };

  return (
    <AdminLayout
      title="Kelola QRIS"
      subtitle="Tambah dan kelola data QRIS untuk setiap campaign"
      back={{ to: "/admin", label: "Kembali ke Dashboard" }}
    >
      <div className="flex justify-end mb-4">
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow-button hover:scale-[1.02] transition-smooth"
        >
          <Plus className="h-4 w-4" /> Tambah QRIS
        </button>
      </div>

      <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700 flex items-start gap-2">
        <QrCode className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <span>Setiap QRIS yang ditambahkan dapat dipilih saat membuat atau mengedit campaign. Donatur akan melihat QRIS yang sesuai dengan campaign yang mereka pilih.</span>
      </div>

      {/* Grid QRIS Cards */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center text-muted-foreground">
          <QrCode className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="font-semibold mb-1">Belum ada QRIS</p>
          <p className="text-sm">Klik "Tambah QRIS" untuk menambahkan QRIS pertama.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map(q => (
            <div key={q.id} className={`bg-card rounded-2xl border p-4 shadow-soft transition-smooth ${q.aktif ? "border-border" : "border-border/50 opacity-60"}`}>
              <div className="flex gap-4">
                {/* QR Image */}
                <div className="flex-shrink-0">
                  <img
                    src={q.gambar_url}
                    alt={q.nama}
                    className="h-24 w-24 object-contain rounded-xl border border-border bg-white p-1"
                  />
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-bold text-sm truncate">{q.nama}</h3>
                    <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      q.aktif ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                    }`}>
                      {q.aktif ? <><CheckCircle2 className="h-3 w-3" /> Aktif</> : "Nonaktif"}
                    </span>
                  </div>
                  {q.deskripsi && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{q.deskripsi}</p>
                  )}
                  <div className="flex items-center gap-2 mt-auto">
                    <button
                      onClick={() => toggleAktif(q)}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-smooth"
                      title={q.aktif ? "Nonaktifkan" : "Aktifkan"}
                    >
                      {q.aktif ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => openEdit(q)}
                      className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-smooth"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => remove(q)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-smooth"
                      title="Hapus"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setOpen(false)}>
          <div
            className="bg-card rounded-2xl shadow-xl w-full max-w-md my-8 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="font-display font-bold text-lg">{editing ? "Edit QRIS" : "Tambah QRIS"}</h2>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Preview */}
              {(preview || form.gambar_url) && (
                <div className="flex justify-center">
                  <img
                    src={preview || form.gambar_url}
                    alt="Preview QRIS"
                    className="h-40 w-40 object-contain rounded-xl border border-border bg-white p-2"
                  />
                </div>
              )}

              <Field label="Gambar QRIS *">
                <div className="space-y-2">
                  <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-secondary hover:bg-secondary/80 cursor-pointer text-sm font-semibold transition-smooth border-2 border-dashed border-border">
                    <Upload className="h-4 w-4" />
                    {file ? file.name : "Upload Gambar QRIS"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
                  </label>
                  <p className="text-xs text-muted-foreground">PNG/JPG, maks 5MB. Atau isi URL di bawah.</p>
                  <input
                    value={form.gambar_url}
                    onChange={e => { setForm({ ...form, gambar_url: e.target.value }); setPreview(null); }}
                    className="w-full px-3 py-2.5 rounded-lg bg-background border border-border focus:border-primary focus:outline-none text-sm"
                    placeholder="https://... (URL gambar QRIS)"
                  />
                </div>
              </Field>

              <Field label="Nama QRIS *">
                <input
                  value={form.nama}
                  onChange={e => setForm({ ...form, nama: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-background border border-border focus:border-primary focus:outline-none"
                  placeholder="Contoh: QRIS Yayasan Teras Dakwah"
                />
              </Field>

              <Field label="Deskripsi (opsional)">
                <textarea
                  value={form.deskripsi}
                  onChange={e => setForm({ ...form, deskripsi: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-lg bg-background border border-border focus:border-primary focus:outline-none resize-none text-sm"
                  placeholder="Keterangan tambahan untuk QRIS ini..."
                />
              </Field>

              <Field label="Status">
                <select
                  value={form.aktif ? "aktif" : "nonaktif"}
                  onChange={e => setForm({ ...form, aktif: e.target.value === "aktif" })}
                  className="w-full px-3 py-2.5 rounded-lg bg-background border border-border focus:border-primary focus:outline-none"
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </Field>
            </div>

            <div className="flex gap-3 p-5 border-t border-border sticky bottom-0 bg-card">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-secondary font-semibold text-sm hover:bg-secondary/80 transition-smooth"
              >
                Batal
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex-[2] px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow-button disabled:opacity-60 transition-smooth flex items-center justify-center gap-2"
              >
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</> : (editing ? "Update" : "Simpan")}
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
    <label className="block text-sm font-bold mb-1.5">{label}</label>
    {children}
  </div>
);

export default AdminQris;
