import { AdminLayout } from "@/components/AdminLayout";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatRupiah } from "@/lib/format";
import { CheckCircle2, Eye, Loader2, Filter, MessageCircle } from "lucide-react";
import { WA_NUMBER, buildFromTemplate, DEFAULT_TEMPLATE_THANKYOU, splitPanggilan } from "@/lib/whatsapp";

type Donation = {
  id: string;
  nama: string;
  nominal: number;
  no_whatsapp: string | null;
  metode_pembayaran: string;
  bukti_transfer: string | null;
  status: string;
  created_at: string;
  campaign_id: string | null;
};

type Campaign = { id: string; judul: string };

const AdminDonations = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCampaign, setFilterCampaign] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [waThankyou, setWaThankyou] = useState(DEFAULT_TEMPLATE_THANKYOU);

  const load = async () => {
    setLoading(true);
    const [dRes, cRes] = await Promise.all([
      supabase.from("donations").select("*").order("created_at", { ascending: false }),
      (supabase as any).from("campaigns").select("id, judul"),
    ]);
    setLoading(false);
    if (dRes.error) toast.error(dRes.error.message);
    else setDonations((dRes.data as Donation[]) ?? []);
    if (cRes.data) setCampaigns(cRes.data as Campaign[]);
  };

  useEffect(() => {
    load();
    // Fetch WA template
    supabase.from("site_settings").select("value").eq("key", "wa_template_thankyou").maybeSingle()
      .then(({ data }) => { if (data?.value) setWaThankyou(data.value); });
    // Realtime: refetch saat ada perubahan donations / campaigns
    const ch = supabase
      .channel("admin-donations-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "donations" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "campaigns" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const verify = async (id: string) => {
    const { error } = await supabase.from("donations").update({ status: "verified" }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Donasi diverifikasi"); load(); }
  };

  const viewBukti = async (path: string) => {
    const { data, error } = await supabase.storage.from("bukti-transfer").createSignedUrl(path, 60);
    if (error) toast.error(error.message);
    else window.open(data.signedUrl, "_blank");
  };

  const campaignName = (id: string | null) =>
    campaigns.find(c => c.id === id)?.judul ?? "—";

  const filtered = useMemo(() => donations.filter(d => {
    if (filterCampaign !== "all" && d.campaign_id !== filterCampaign) return false;
    if (filterStatus !== "all" && d.status !== filterStatus) return false;
    return true;
  }), [donations, filterCampaign, filterStatus]);

  const totalVerified = filtered.filter(d => d.status === "verified").reduce((s, d) => s + d.nominal, 0);
  const totalPending = filtered.filter(d => d.status === "pending").length;

  const openWa = (d: Donation) => {
    const { panggilan, nama } = splitPanggilan(d.nama);
    const text = buildFromTemplate(waThankyou, {
      panggilan,
      nama,
      nominal: new Intl.NumberFormat("id-ID").format(d.nominal),
      campaign: campaignName(d.campaign_id),
    });
    const target = d.no_whatsapp
      ? `62${d.no_whatsapp.replace(/^0/, "")}`
      : WA_NUMBER;
    window.open(`https://wa.me/${target}?text=${encodeURIComponent(text)}`, "_blank");
  };

  // Real-time stats matching the homepage
  const totalTerkumpulHome = campaigns.reduce((s: number, c: any) => s + Number(c.terkumpul ?? 0), 0);
  const jumlahDonasiHome = donations.filter(d => d.status === "verified").length;
  const aktifProgramHome = campaigns.length;

  return (
    <AdminLayout
      title="Daftar Donasi"
      subtitle="Lihat siapa saja yang berdonasi & verifikasi pembayaran"
      back={{ to: "/admin", label: "Kembali ke Dashboard" }}
    >
      {/* Stats — sinkron real-time dengan tampilan home */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Total Donasi</div>
          <div className="font-display font-extrabold text-2xl text-primary mt-1">{formatRupiah(totalTerkumpulHome)}</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Jumlah Donasi</div>
          <div className="font-display font-extrabold text-2xl mt-1">{jumlahDonasiHome.toLocaleString("id-ID")}</div>
        </div>
        <div className="bg-card border border-warning/40 rounded-2xl p-5">
          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Aktif Program</div>
          <div className="font-display font-extrabold text-2xl text-warning mt-1">{aktifProgramHome}</div>
        </div>
      </div>

      {/* Sub-stats: pending */}
      <div className="text-xs text-muted-foreground mb-4">
        Menunggu verifikasi: <span className="font-bold text-warning">{donations.filter(d => d.status === "pending").length}</span>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-4 flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <select
          value={filterCampaign}
          onChange={e => setFilterCampaign(e.target.value)}
          className="px-3 py-2 rounded-lg bg-background border border-border text-sm focus:border-primary focus:outline-none"
        >
          <option value="all">Semua Campaign</option>
          {campaigns.map(c => <option key={c.id} value={c.id}>{c.judul}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg bg-background border border-border text-sm focus:border-primary focus:outline-none"
        >
          <option value="all">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border shadow-soft min-w-0 max-w-full">
        <div className="overflow-x-auto rounded-2xl">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-bold">Tanggal</th>
                <th className="px-4 py-3 font-bold">Nama</th>
                <th className="px-4 py-3 font-bold">Campaign</th>
                <th className="px-4 py-3 font-bold">Nominal</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                </td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">Belum ada donasi.</td></tr>
              )}
              {filtered.map(d => (
                <tr key={d.id} className="border-t border-border hover:bg-muted/30 transition-smooth">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(d.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 font-semibold">{d.nama}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{campaignName(d.campaign_id)}</td>
                  <td className="px-4 py-3 font-bold text-primary whitespace-nowrap">{formatRupiah(d.nominal)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      d.status === "verified" ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"
                    }`}>
                      {d.status === "verified" ? "Berhasil" : "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {d.bukti_transfer && (
                        <button onClick={() => viewBukti(d.bukti_transfer!)} className="p-2 rounded-lg hover:bg-muted text-foreground transition-smooth" title="Lihat bukti">
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      <button onClick={() => openWa(d)} className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-smooth" title="Hubungi via WhatsApp">
                        <MessageCircle className="h-4 w-4" />
                      </button>
                      {d.status !== "verified" && (
                        <button onClick={() => verify(d.id)} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold inline-flex items-center gap-1 shadow-button">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Verifikasi
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDonations;
