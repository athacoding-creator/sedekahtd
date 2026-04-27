import { AdminLayout } from "@/components/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Loader2, Eye, FileImage, AlertTriangle, RefreshCw, Search, X } from "lucide-react";
import { formatRupiah } from "@/lib/format";

type BuktiItem = {
  id: string; // donation id
  nama: string;
  nominal: number;
  campaign_judul: string | null;
  bukti_transfer: string; // storage path
  status: string;
  created_at: string;
};

const AdminStorage = () => {
  const [items, setItems] = useState<BuktiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("donations")
      .select("id, nama, nominal, bukti_transfer, status, created_at, campaigns(judul)")
      .not("bukti_transfer", "is", null)
      .order("created_at", { ascending: false });

    setLoading(false);
    if (error) { toast.error(error.message); return; }

    const mapped: BuktiItem[] = (data ?? []).map((d: any) => ({
      id: d.id,
      nama: d.nama,
      nominal: d.nominal,
      campaign_judul: d.campaigns?.judul ?? null,
      bukti_transfer: d.bukti_transfer,
      status: d.status,
      created_at: d.created_at,
    }));
    setItems(mapped);
  };

  useEffect(() => { load(); }, []);

  const viewBukti = async (path: string) => {
    setViewLoading(true);
    const { data, error } = await supabase.storage
      .from("bukti-transfer")
      .createSignedUrl(path, 120);
    setViewLoading(false);
    if (error) { toast.error("Gagal membuka bukti: " + error.message); return; }
    setViewUrl(data.signedUrl);
  };

  const deleteBukti = async (item: BuktiItem) => {
    if (!confirm(`Hapus bukti pembayaran dari "${item.nama}"?\nFile akan dihapus permanen dari storage.`)) return;

    setDeleting(item.id);
    try {
      // Delete file from storage
      const { error: storageErr } = await supabase.storage
        .from("bukti-transfer")
        .remove([item.bukti_transfer]);
      if (storageErr) throw storageErr;

      // Clear bukti_transfer field in donation (keep the donation record)
      const { error: dbErr } = await supabase
        .from("donations")
        .update({ bukti_transfer: null })
        .eq("id", item.id);
      if (dbErr) throw dbErr;

      toast.success("Bukti pembayaran dihapus");
      load();
    } catch (e: any) {
      toast.error(e.message || "Gagal menghapus");
    } finally {
      setDeleting(null);
    }
  };

  const deleteWithDonation = async (item: BuktiItem) => {
    if (!confirm(`Hapus SELURUH data donasi dari "${item.nama}" (${formatRupiah(item.nominal)})?\nBukti dan data donasi akan dihapus permanen.`)) return;

    setDeleting(item.id);
    try {
      // Delete file from storage
      if (item.bukti_transfer) {
        await supabase.storage.from("bukti-transfer").remove([item.bukti_transfer]);
      }
      // Delete donation record
      const { error } = await supabase.from("donations").delete().eq("id", item.id);
      if (error) throw error;

      toast.success("Data donasi dan bukti dihapus");
      load();
    } catch (e: any) {
      toast.error(e.message || "Gagal menghapus");
    } finally {
      setDeleting(null);
    }
  };

  const filtered = items.filter(item => {
    const matchSearch = !search ||
      item.nama.toLowerCase().includes(search.toLowerCase()) ||
      (item.campaign_judul ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || item.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700",
      verified: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
    };
    return map[status] ?? "bg-muted text-muted-foreground";
  };

  return (
    <AdminLayout
      title="Kelola Storage"
      subtitle="Lihat dan hapus bukti pembayaran donatur"
      back={{ to: "/admin", label: "Kembali ke Dashboard" }}
    >
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <div className="text-2xl font-extrabold font-display">{items.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Total Bukti</div>
        </div>
        <div className="bg-card rounded-xl border border-yellow-200 p-4 text-center">
          <div className="text-2xl font-extrabold font-display text-yellow-600">
            {items.filter(i => i.status === "pending").length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Pending</div>
        </div>
        <div className="bg-card rounded-xl border border-green-200 p-4 text-center">
          <div className="text-2xl font-extrabold font-display text-green-600">
            {items.filter(i => i.status === "verified").length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Verified</div>
        </div>
      </div>

      {/* Warning */}
      <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <span>Menghapus bukti pembayaran bersifat <strong>permanen</strong>. Pastikan data sudah tidak diperlukan sebelum menghapus.</span>
      </div>

      {/* Filter & Search */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama donatur atau campaign..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-background border border-border focus:border-primary focus:outline-none text-sm"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 rounded-lg bg-background border border-border focus:border-primary focus:outline-none text-sm"
        >
          <option value="all">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
        <button
          onClick={load}
          className="p-2.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-smooth"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-bold">Donatur</th>
                <th className="px-4 py-3 font-bold">Campaign</th>
                <th className="px-4 py-3 font-bold">Nominal</th>
                <th className="px-4 py-3 font-bold">Tanggal</th>
                <th className="px-4 py-3 font-bold text-center">Status</th>
                <th className="px-4 py-3 font-bold text-center">Bukti</th>
                <th className="px-4 py-3 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                </td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  {items.length === 0 ? "Belum ada bukti pembayaran." : "Tidak ada hasil yang cocok."}
                </td></tr>
              )}
              {filtered.map(item => (
                <tr key={item.id} className="border-t border-border hover:bg-muted/30 transition-smooth">
                  <td className="px-4 py-3 font-semibold">{item.nama}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs max-w-[140px] truncate">
                    {item.campaign_judul ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-bold text-primary whitespace-nowrap">
                    {formatRupiah(item.nominal)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                    {formatDate(item.created_at)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusBadge(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => viewBukti(item.bukti_transfer)}
                      disabled={viewLoading}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-smooth disabled:opacity-50"
                    >
                      {viewLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
                      Lihat
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => deleteBukti(item)}
                        disabled={deleting === item.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-50 text-orange-600 text-xs font-semibold hover:bg-orange-100 transition-smooth disabled:opacity-50"
                        title="Hapus file bukti saja"
                      >
                        {deleting === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileImage className="h-3 w-3" />}
                        Hapus File
                      </button>
                      <button
                        onClick={() => deleteWithDonation(item)}
                        disabled={deleting === item.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20 transition-smooth disabled:opacity-50"
                        title="Hapus donasi + file bukti"
                      >
                        {deleting === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                        Hapus Semua
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal View Bukti */}
      {viewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setViewUrl(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setViewUrl(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-smooth"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={viewUrl}
              alt="Bukti Pembayaran"
              className="w-full rounded-2xl shadow-2xl"
            />
            <a
              href={viewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-sm font-semibold hover:bg-gray-100 transition-smooth"
            >
              <Eye className="h-4 w-4" /> Buka di Tab Baru
            </a>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminStorage;
