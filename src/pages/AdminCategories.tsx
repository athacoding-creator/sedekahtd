import { AdminLayout } from "@/components/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, X, Save, GripVertical } from "lucide-react";

type Category = {
  id: string;
  nama: string;
  urutan: number;
  aktif: boolean;
};

const AdminCategories = () => {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [nama, setNama] = useState("");
  const [aktif, setAktif] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("categories")
      .select("*")
      .order("urutan")
      .order("nama");
    setLoading(false);
    if (error) toast.error(error.message);
    else setItems((data as Category[]) ?? []);
  };

  useEffect(() => {
    load();
    // Realtime subscription
    const channel = supabase
      .channel("admin-categories-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, () => {
        load();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const openCreate = () => {
    setEditing(null);
    setNama("");
    setAktif(true);
    setOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setNama(c.nama);
    setAktif(c.aktif);
    setOpen(true);
  };

  const save = async () => {
    if (!nama.trim()) { toast.error("Nama kategori wajib diisi"); return; }
    setSaving(true);
    try {
      if (editing) {
        const { error } = await (supabase as any)
          .from("categories")
          .update({ nama: nama.trim(), aktif })
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("Kategori diperbarui");
      } else {
        const maxUrutan = items.length > 0 ? Math.max(...items.map(i => i.urutan)) + 1 : 0;
        const { error } = await (supabase as any)
          .from("categories")
          .insert({ nama: nama.trim(), aktif, urutan: maxUrutan });
        if (error) throw error;
        toast.success("Kategori ditambahkan");
      }
      setOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: Category) => {
    if (!confirm(`Hapus kategori "${c.nama}"?`)) return;
    const { error } = await (supabase as any).from("categories").delete().eq("id", c.id);
    if (error) toast.error(error.message);
    else { toast.success("Kategori dihapus"); load(); }
  };

  const toggleAktif = async (c: Category) => {
    const { error } = await (supabase as any)
      .from("categories")
      .update({ aktif: !c.aktif })
      .eq("id", c.id);
    if (error) toast.error(error.message);
    else load();
  };

  return (
    <AdminLayout
      title="Kelola Kategori"
      subtitle="Tambah, edit, dan hapus kategori campaign"
      back={{ to: "/admin", label: "Kembali ke Dashboard" }}
    >
      <div className="flex justify-end mb-4">
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow-button hover:scale-[1.02] transition-smooth"
        >
          <Plus className="h-4 w-4" /> Tambah Kategori
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-bold">Urutan</th>
                <th className="px-4 py-3 font-bold">Nama Kategori</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                </td></tr>
              )}
              {!loading && items.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">Belum ada kategori.</td></tr>
              )}
              {items.map((c, i) => (
                <tr key={c.id} className="border-t border-border hover:bg-muted/30 transition-smooth">
                  <td className="px-4 py-3 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                      {i + 1}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold">{c.nama}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleAktif(c)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-smooth ${
                        c.aktif
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {c.aktif ? "Aktif" : "Nonaktif"}
                    </button>
                  </td>
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
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-display font-bold text-lg">{editing ? "Edit Kategori" : "Tambah Kategori"}</h2>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Nama Kategori *</label>
                <input
                  value={nama}
                  onChange={e => setNama(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-background border border-border focus:border-primary focus:outline-none"
                  placeholder="Contoh: Pendidikan"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-background">
                <span className="text-sm font-semibold">Aktif</span>
                <button
                  type="button"
                  onClick={() => setAktif(s => !s)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                    aktif ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                    aktif ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
              </div>
              <button
                onClick={save}
                disabled={saving}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-button hover:scale-[1.02] transition-smooth disabled:opacity-60"
              >
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</> : <><Save className="h-4 w-4" /> Simpan</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCategories;
