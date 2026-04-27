import { AdminLayout } from "@/components/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload, Loader2, X, Image as ImageIcon, GripVertical, Eye, EyeOff, Link as LinkIcon } from "lucide-react";

type Hero = {
  id: string;
  judul: string;
  gambar_url: string;
  link_url: string | null;
  urutan: number;
  aktif: boolean;
  created_at: string;
};

const empty = { judul: "", gambar_url: "", link_url: "", urutan: 0, aktif: true };

const AdminHeroes = () => {
  const [items, setItems] = useState<Hero[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Hero | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("heroes")
      .select("*")
      .order("urutan", { ascending: true });
    setLoading(false);
    if (error) toast.error(error.message);
    else setItems((data as Hero[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...empty, urutan: items.length + 1 });
    setFile(null);
    setPreview(null);
    setOpen(true);
  };

  const openEdit = (h: Hero) => {
    setEditing(h);
    setForm({
      judul: h.judul,
      gambar_url: h.gambar_url,
      link_url: h.link_url ?? "",
      urutan: h.urutan,
      aktif: h.aktif,
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
    const { error } = await supabase.storage.from("heroes").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("heroes").getPublicUrl(path);
    return data.publicUrl;
  };

  const save = async () => {
    if (!form.judul.trim()) { toast.error("Judul wajib diisi"); return; }
    if (!file && !form.gambar_url.trim()) { toast.error("Gambar wajib diisi"); return; }

    setSaving(true);
    try {
      const gambar_url = await uploadImage();
      const payload = {
        judul: form.judul.trim(),
        gambar_url,
        link_url: form.link_url.trim() || null,
        urutan: Number(form.urutan) || 0,
        aktif: form.aktif,
      };

      if (editing) {
        const { error } = await supabase.from("heroes").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Hero diperbarui");
      } else {
        const { error } = await supabase.from("heroes").insert(payload);
        if (error) throw error;
        toast.success("Hero ditambahkan");
      }
      setOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (h: Hero) => {
    if (!confirm(`Hapus hero "${h.judul}"?`)) return;
    // Delete image from storage if it's from our bucket
    if (h.gambar_url.includes("supabase") && h.gambar_url.includes("/heroes/")) {
      const path = h.gambar_url.split("/heroes/").pop();
      if (path) await supabase.storage.from("heroes").remove([path]);
    }
    const { error } = await supabase.from("heroes").delete().eq("id", h.id);
    if (error) toast.error(error.message);
    else { toast.success("Hero dihapus"); load(); }
  };

  const toggleAktif = async (h: Hero) => {
    const { error } = await supabase.from("heroes").update({ aktif: !h.aktif }).eq("id", h.id);
    if (error) toast.error(error.message);
    else {
      toast.success(h.aktif ? "Hero disembunyikan" : "Hero ditampilkan");
      load();
    }
  };

  return (
    <AdminLayout
      title="Kelola Hero Banner"
      subtitle="Atur tampilan banner/slider di halaman utama"
      back={{ to: "/admin", label: "Kembali ke Dashboard" }}
    >
      <div className="flex justify-end mb-4">
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow-button hover:scale-[1.02] transition-smooth"
        >
          <Plus className="h-4 w-4" /> Tambah Hero
        </button>
      </div>

      {/* Preview info */}
      <div className="mb-4 p-3 rounded-xl bg-primary/5 border border-primary/20 text-sm text-primary flex items-center gap-2">
        <Eye className="h-4 w-4 flex-shrink-0" />
        <span>Hero yang aktif akan tampil sebagai slider di halaman utama, diurutkan berdasarkan nomor urutan.</span>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-bold w-8">#</th>
                <th className="px-4 py-3 font-bold">Gambar</th>
                <th className="px-4 py-3 font-bold">Judul</th>
                <th className="px-4 py-3 font-bold">Link</th>
                <th className="px-4 py-3 font-bold text-center">Status</th>
                <th className="px-4 py-3 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                </td></tr>
              )}
              {!loading && items.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  Belum ada hero banner. Klik "Tambah Hero" untuk mulai.
                </td></tr>
              )}
              {items.map(h => (
                <tr key={h.id} className="border-t border-border hover:bg-muted/30 transition-smooth">
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                    <div className="flex items-center gap-1">
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />
                      {h.urutan}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <img
                      src={h.gambar_url}
                      alt={h.judul}
                      className="h-14 w-24 object-cover rounded-lg border border-border"
                    />
                  </td>
                  <td className="px-4 py-3 font-semibold max-w-[200px] truncate">{h.judul}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs max-w-[120px] truncate">
                    {h.link_url ? (
                      <span className="flex items-center gap-1">
                        <LinkIcon className="h-3 w-3" /> {h.link_url}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleAktif(h)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-smooth ${
                        h.aktif
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {h.aktif ? <><Eye className="h-3 w-3" /> Aktif</> : <><EyeOff className="h-3 w-3" /> Nonaktif</>}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(h)} className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-smooth" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => remove(h)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-smooth" title="Hapus">
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
            <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="font-display font-bold text-lg">{editing ? "Edit Hero Banner" : "Tambah Hero Banner"}</h2>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Preview gambar */}
              {(preview || form.gambar_url) && (
                <div className="rounded-xl overflow-hidden border border-border">
                  <img
                    src={preview || form.gambar_url}
                    alt="Preview"
                    className="w-full h-40 object-cover"
                  />
                </div>
              )}

              <Field label="Gambar Hero *">
                <div className="space-y-2">
                  <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-secondary hover:bg-secondary/80 cursor-pointer text-sm font-semibold transition-smooth border-2 border-dashed border-border">
                    <Upload className="h-4 w-4" />
                    {file ? "Ganti Gambar" : "Upload Gambar"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
                  </label>
                  <p className="text-xs text-muted-foreground">PNG/JPG, maks 5MB. Atau isi URL gambar di bawah.</p>
                  <input
                    value={form.gambar_url}
                    onChange={e => { setForm({ ...form, gambar_url: e.target.value }); setPreview(null); }}
                    className="w-full px-3 py-2.5 rounded-lg bg-background border border-border focus:border-primary focus:outline-none text-sm"
                    placeholder="https://... (URL gambar eksternal)"
                  />
                </div>
              </Field>

              <Field label="Judul Hero *">
                <input
                  value={form.judul}
                  onChange={e => setForm({ ...form, judul: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-background border border-border focus:border-primary focus:outline-none"
                  placeholder="Contoh: Sedekah Jumat Pahala Berlipat"
                />
              </Field>

              <Field label="Link URL (opsional)">
                <input
                  value={form.link_url}
                  onChange={e => setForm({ ...form, link_url: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-background border border-border focus:border-primary focus:outline-none"
                  placeholder="/campaign atau https://..."
                />
                <p className="text-xs text-muted-foreground mt-1">Klik pada hero akan mengarah ke URL ini</p>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Urutan">
                  <input
                    type="number"
                    value={form.urutan}
                    onChange={e => setForm({ ...form, urutan: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-lg bg-background border border-border focus:border-primary focus:outline-none"
                    min={1}
                  />
                </Field>
                <Field label="Status">
                  <select
                    value={form.aktif ? "aktif" : "nonaktif"}
                    onChange={e => setForm({ ...form, aktif: e.target.value === "aktif" })}
                    className="w-full px-3 py-2.5 rounded-lg bg-background border border-border focus:border-primary focus:outline-none"
                  >
                    <option value="aktif">Aktif (tampil)</option>
                    <option value="nonaktif">Nonaktif (disembunyikan)</option>
                  </select>
                </Field>
              </div>
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

export default AdminHeroes;
