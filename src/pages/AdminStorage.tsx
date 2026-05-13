import { AdminLayout } from "@/components/AdminLayout";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Loader2, FileSpreadsheet } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import * as XLSX from "xlsx";

type Campaign = { id: string; judul: string };
type Donation = {
  id: string;
  nama: string;
  nominal: number;
  no_whatsapp: string | null;
  metode_pembayaran: string;
  status: string;
  pesan: string | null;
  created_at: string;
  campaign_id: string | null;
};

const todayStr = () => new Date().toISOString().slice(0, 10);
const daysAgoStr = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

const AdminStorage = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignId, setCampaignId] = useState<string>("all");
  const [status, setStatus] = useState<string>("verified");
  const [from, setFrom] = useState<string>(daysAgoStr(30));
  const [to, setTo] = useState<string>(todayStr());
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<Donation[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    (supabase as any).from("campaigns").select("id, judul").order("created_at", { ascending: false })
      .then(({ data }: any) => { if (data) setCampaigns(data); });
  }, []);

  const fetchData = async (): Promise<Donation[]> => {
    let q = supabase
      .from("donations")
      .select("*")
      .gte("created_at", `${from}T00:00:00`)
      .lte("created_at", `${to}T23:59:59`)
      .order("created_at", { ascending: false });
    if (campaignId !== "all") q = q.eq("campaign_id", campaignId);
    if (status !== "all") q = q.eq("status", status);
    const { data, error } = await q;
    if (error) { toast.error(error.message); return []; }
    return (data as Donation[]) ?? [];
  };

  const loadPreview = async () => {
    setPreviewLoading(true);
    const data = await fetchData();
    setPreview(data);
    setPreviewLoading(false);
  };

  useEffect(() => { loadPreview(); /* eslint-disable-next-line */ }, [campaignId, status, from, to]);

  const campaignName = (id: string | null) =>
    campaigns.find(c => c.id === id)?.judul ?? "—";

  const downloadExcel = async () => {
    setLoading(true);
    const data = await fetchData();
    if (data.length === 0) {
      setLoading(false);
      toast.error("Tidak ada data untuk diunduh");
      return;
    }

    const rows = data.map((d, i) => ({
      "No": i + 1,
      "Tanggal": new Date(d.created_at).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" }),
      "Nama Donatur": d.nama,
      "WhatsApp": d.no_whatsapp ?? "",
      "Campaign": campaignName(d.campaign_id),
      "Nominal (Rp)": d.nominal,
      "Metode Pembayaran": d.metode_pembayaran,
      "Status": d.status,
      "Pesan": d.pesan ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 5 }, { wch: 18 }, { wch: 25 }, { wch: 16 },
      { wch: 30 }, { wch: 15 }, { wch: 18 }, { wch: 12 }, { wch: 40 },
    ];
    const wb = XLSX.utils.book_new();
    const sheetName = campaignId === "all"
      ? "Semua Campaign"
      : (campaignName(campaignId).slice(0, 28) || "Campaign");
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const fname = `donatur_${campaignId === "all" ? "semua" : campaignName(campaignId).replace(/[^a-z0-9]+/gi, "_").toLowerCase()}_${from}_${to}.xlsx`;
    XLSX.writeFile(wb, fname);
    setLoading(false);
    toast.success(`${data.length} data berhasil diunduh`);
  };

  const totalNominal = useMemo(
    () => preview.reduce((s, d) => s + (d.nominal || 0), 0),
    [preview]
  );

  return (
    <AdminLayout
      title="Download Data Donatur"
      subtitle="Export data donasi per campaign & rentang tanggal ke Excel"
      back={{ to: "/admin", label: "Kembali ke Dashboard" }}
    >
      {/* Filter Form */}
      <div className="bg-card rounded-2xl border border-border shadow-soft p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5 block">Campaign</label>
            <select
              value={campaignId}
              onChange={e => setCampaignId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-background border border-border focus:border-primary focus:outline-none text-sm"
            >
              <option value="all">Semua Campaign</option>
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.judul}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5 block">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-background border border-border focus:border-primary focus:outline-none text-sm"
            >
              <option value="all">Semua Status</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5 block">Dari Tanggal</label>
            <input
              type="date"
              value={from}
              onChange={e => setFrom(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-background border border-border focus:border-primary focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5 block">Sampai Tanggal</label>
            <input
              type="date"
              value={to}
              onChange={e => setTo(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-background border border-border focus:border-primary focus:outline-none text-sm"
            />
          </div>
        </div>

        {/* Quick range buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { label: "Hari Ini", from: todayStr(), to: todayStr() },
            { label: "7 Hari", from: daysAgoStr(7), to: todayStr() },
            { label: "30 Hari", from: daysAgoStr(30), to: todayStr() },
            { label: "90 Hari", from: daysAgoStr(90), to: todayStr() },
            { label: "Tahun Ini", from: `${new Date().getFullYear()}-01-01`, to: todayStr() },
          ].map(r => (
            <button
              key={r.label}
              onClick={() => { setFrom(r.from); setTo(r.to); }}
              className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-xs font-semibold transition-smooth"
            >
              {r.label}
            </button>
          ))}
        </div>

        <button
          onClick={downloadExcel}
          disabled={loading || preview.length === 0}
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-button hover:opacity-90 transition-smooth disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Download Excel ({preview.length} data)
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Jumlah Donatur</div>
          <div className="font-display font-extrabold text-2xl mt-1">{preview.length.toLocaleString("id-ID")}</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Total Nominal</div>
          <div className="font-display font-extrabold text-2xl text-primary mt-1">{formatRupiah(totalNominal)}</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Periode</div>
          <div className="font-display font-extrabold text-sm mt-1">
            {new Date(from).toLocaleDateString("id-ID")} – {new Date(to).toLocaleDateString("id-ID")}
          </div>
        </div>
      </div>

      {/* Preview Table */}
      <div className="bg-card rounded-2xl border border-border shadow-soft">
        <div className="px-5 py-3 border-b border-border flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-primary" />
          <span className="font-bold text-sm">Preview Data</span>
        </div>
        <div className="overflow-x-auto rounded-b-2xl">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-bold">Tanggal</th>
                <th className="px-4 py-3 font-bold">Nama</th>
                <th className="px-4 py-3 font-bold">WhatsApp</th>
                <th className="px-4 py-3 font-bold">Campaign</th>
                <th className="px-4 py-3 font-bold">Nominal</th>
                <th className="px-4 py-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {previewLoading && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                </td></tr>
              )}
              {!previewLoading && preview.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  Tidak ada data pada filter ini.
                </td></tr>
              )}
              {!previewLoading && preview.slice(0, 50).map(d => (
                <tr key={d.id} className="border-t border-border hover:bg-muted/30 transition-smooth">
                  <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap text-xs">
                    {new Date(d.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-2.5 font-semibold">{d.nama}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{d.no_whatsapp ?? "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs max-w-[200px] truncate">{campaignName(d.campaign_id)}</td>
                  <td className="px-4 py-2.5 font-bold text-primary whitespace-nowrap">{formatRupiah(d.nominal)}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      d.status === "verified" ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"
                    }`}>
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {preview.length > 50 && (
            <div className="px-5 py-3 text-center text-xs text-muted-foreground border-t border-border">
              Menampilkan 50 dari {preview.length} data. Download Excel untuk melihat semua.
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminStorage;
