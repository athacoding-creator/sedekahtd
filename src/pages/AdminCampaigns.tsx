import { AdminLayout } from "@/components/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatRupiah } from "@/lib/format";
import { Plus, Pencil, Trash2, Upload, Loader2, X, Image as ImageIcon } from "lucide-react";

type Campaign = {
  id: string;
  judul: string;
  deskripsi: string;
  kategori: string | null;
  target: number;
  terkumpul: number;
  gambar_url: string | null;
};

const empty = { judul: "", deskripsi: "", kategori: "", target: 0, gambar_url: "" };

const AdminCampaigns = () => {
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
    setLoading(false);
    if (error) toast.error(error.message);
    else setItems((data as Campaign[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...empty });
    setFile(null);
    setOpen(true);
  };

  const openEdit = (c: Campaign) => {
    setEditing(c);
    setForm({
      judul: c.judul,
      deskripsi: c.deskripsi,
      kategori: c.kategori ?? "",
      target: c.target,
      gambar_url: c.gambar_url ?? "",
    });
    setFile(null);
    setOpen(true);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!file) return form.gambar_url || null;
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("campaigns").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("campaigns").getPublicUrl(path);
    return data.publicUrl;
  };

  const save = async () => {
    if (!form.judul.trim() || !form.deskripsi.trim()) {
      toast.error("Judul & deskripsi wajib diisi"); return;
    }
    if (form.target <= 0) { toast.error("Target donasi harus lebih dari 0"); return; }

    setSaving(true);
    try {
      const gambar_url = await uploadImage();
      const payload = {
        judul: form.judul.trim(),
        deskripsi: form.deskripsi.trim(),
        kategori: form.kategori.trim() || null,
        target: Number(form.target),
        gambar_url,
      };

      if (editing) {
        const { error } = await supabase.from("campaigns").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Campaign diperbarui");
      } else {
        const { error } = await supabase.from("campaigns").insert(payload);
        if (error) throw error;
        toast.success("Campaign ditambahkan");
      }
      setOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: Campaign) => {
    if (!confirm(`Hapus campaign "${c.judul}"?`)) return;
    const { error } = await supabase.from("campaigns").delete().eq("id", c.id);
    if (error) toast.error(error.message);
    else { toast.success("Campaign dihapus"); load(); }
  };

  return (
    <AdminLayout
      title="Kelola Campaign"
      subtitle="Tambah, edit, dan hapus campaign dakwah"
      back={{ to: "/admin", label: "Kembali ke Dashboard" }}
    >
      <div className="flex justify-end mb-4">
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow-button hover:scale-[1.02] transition-smooth"
        >
          <Plus className="h-4 w-4" /> Tambah Campaign
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-bold">Gambar</th>
                <th className="px-4 py-3 font-bold">Judul</th>
                <th className="px-4 py-3 font-bold">Target</th>
                <th className="px-4 py-3 font-bold">Terkumpul</th>
                <th className="px-4 py-3 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                </td></tr>
              )}
              {!loading && items.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">Belum ada campaign.</td></tr>
              )}
              {items.map(c => (
                <tr key={c.id} className="border-t border-border hover:bg-muted/30 transition-smooth">
                  <td className="px-4 py-3">
                    {c.gambar_url ? (
                      <img src={c.gambar_url} alt={c.judul} className="h-12 w-12 object-cover rounded-lg border border-border" />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold max-w-xs truncate">{c.judul}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatRupiah(c.target)}</td>
                  <td className="px-4 py-3 font-bold text-primary whitespace-nowrap">{formatRupiah(c.terkumpul)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(c)} className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-smooth" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => remove(c)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-smooth" title="Hapus">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setOpen(false)}>
          <div
            className="bg-card rounded-2xl shadow-xl w-full max-w-lg my-8 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
              <h2 className="font-display font-bold text-lg">{editing ? "Edit Campaign" : "Tambah Campaign"}</h2>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <Field label="Judul Campaign *">
                <input
                  value={form.judul}
                  onChange={e => setForm({ ...form, judul: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-background border border-border focus:border-primary focus:outline-none"
                  placeholder="Contoh: Bangun Masjid Teras Dakwah"
                />
              </Field>

              <Field label="Deskripsi *">
                <textarea
                  value={form.deskripsi}
                  onChange={e => setForm({ ...form, deskripsi: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2.5 rounded-lg bg-background border border-border focus:border-primary focus:outline-none resize-none"
                  placeholder="Jelaskan campaign ini..."
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Kategori">
                  <input
                    value={form.kategori}
                    onChange={e => setForm({ ...form, kategori: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-background border border-border focus:border-primary focus:outline-none"
                    placeholder="Wakaf, Yatim, dll"
                  />
                </Field>
                <Field label="Target Donasi (Rp) *">
                  <input
                    type="number"
                    value={form.target || ""}
                    onChange={e => setForm({ ...form, target: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-lg bg-background border border-border focus:border-primary focus:outline-none"
                    placeholder="300000000"
                  />
                </Field>
              </div>

              <Field label="Gambar Campaign">
                <div className="flex items-start gap-3">
                  {(file || form.gambar_url) && (
                    <img
                      src={file ? URL.createObjectURL(file) : form.gambar_url}
                      alt=""
                      className="h-20 w-20 object-cover rounded-lg border border-border"
                    />
                  )}
                  <label className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-secondary hover:bg-secondary/80 cursor-pointer text-sm font-semibold transition-smooth">
                    <Upload className="h-4 w-4" />
                    {file ? "Ganti Gambar" : "Upload Gambar"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        if (f.size > 5 * 1024 * 1024) { toast.error("Maks 5MB"); return; }
                        setFile(f);
                      }}
                    />
                  </label>
                </div>
                <p className="text-xs text-muted-foreground mt-2">PNG/JPG, maks 5MB</p>
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
                className="flex-[2] px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow-button disabled:opacity-60 transition-smooth"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : (editing ? "Update" : "Simpan")}
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

export default AdminCampaigns;
