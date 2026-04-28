import { AdminLayout } from "@/components/AdminLayout";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatRupiah } from "@/lib/format";
import { Loader2, Users, FileText, UserCheck, Receipt, Wallet, Percent, ExternalLink } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

type Campaign = {
  id: string;
  judul: string;
  gambar_url: string | null;
  fb_pixel_id: string | null;
};

type Donation = {
  id: string;
  nama: string;
  nominal: number;
  status: string;
  created_at: string;
};

type Visit = { id: string; visitor_id: string | null; created_at: string };

const RANGE_OPTIONS = [
  { label: "7 hari", days: 7 },
  { label: "30 hari", days: 30 },
  { label: "90 hari", days: 90 },
  { label: "Semua", days: 0 },
];

const fmtDate = (d: Date) =>
  d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });

const AdminCampaignAnalytics = () => {
  const { id } = useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [rangeDays, setRangeDays] = useState(30);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const [cRes, dRes, vRes] = await Promise.all([
      (supabase as any).from("campaigns").select("id, judul, gambar_url, fb_pixel_id").eq("id", id).maybeSingle(),
      (supabase as any).from("donations").select("id, nama, nominal, status, created_at").eq("campaign_id", id).order("created_at", { ascending: false }),
      (supabase as any).from("campaign_visits").select("id, visitor_id, created_at").eq("campaign_id", id).order("created_at", { ascending: false }),
    ]);
    setLoading(false);
    setCampaign(cRes.data as Campaign);
    setDonations((dRes.data as Donation[]) ?? []);
    setVisits((vRes.data as Visit[]) ?? []);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`campaign-analytics-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "donations", filter: `campaign_id=eq.${id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "campaign_visits", filter: `campaign_id=eq.${id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const filteredDonations = useMemo(() => {
    if (rangeDays === 0) return donations;
    const cutoff = Date.now() - rangeDays * 86400000;
    return donations.filter(d => new Date(d.created_at).getTime() >= cutoff);
  }, [donations, rangeDays]);

  const filteredVisits = useMemo(() => {
    if (rangeDays === 0) return visits;
    const cutoff = Date.now() - rangeDays * 86400000;
    return visits.filter(v => new Date(v.created_at).getTime() >= cutoff);
  }, [visits, rangeDays]);

  const verified = filteredDonations.filter(d => d.status === "verified");

  // Stats
  const totalKunjungan = filteredVisits.length;
  const uniqueVisitor = new Set(filteredVisits.map(v => v.visitor_id).filter(Boolean)).size;
  const mengisiData = filteredDonations.length;
  const totalDonatur = new Set(verified.map(d => d.nama.toLowerCase())).size;
  const jumlahTransaksi = verified.length;
  const jumlahDonasi = verified.reduce((s, d) => s + d.nominal, 0);
  const persentase = mengisiData > 0 ? Math.round((jumlahTransaksi / mengisiData) * 100) : 0;

  // Chart data
  const chartData = useMemo(() => {
    const days = rangeDays === 0 ? 60 : rangeDays;
    const map = new Map<string, { date: string; count: number; sum: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map.set(key, { date: fmtDate(d), count: 0, sum: 0 });
    }
    verified.forEach(d => {
      const key = new Date(d.created_at).toISOString().slice(0, 10);
      const e = map.get(key);
      if (e) { e.count += 1; e.sum += d.nominal; }
    });
    return Array.from(map.values());
  }, [verified, rangeDays]);

  return (
    <AdminLayout
      title="Analytics Campaign"
      subtitle="Tracking pengunjung & donasi per campaign"
      back={{ to: "/admin/campaigns", label: "Kembali ke Daftar Campaign" }}
    >
      {loading || !campaign ? (
        <div className="py-20 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
      ) : (
        <>
          {/* Header campaign */}
          <div className="bg-card border border-border rounded-2xl p-4 mb-6 flex items-center gap-4 shadow-soft">
            {campaign.gambar_url && (
              <img src={campaign.gambar_url} alt={campaign.judul} className="h-16 w-16 object-cover rounded-xl" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold truncate">{campaign.judul}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {campaign.fb_pixel_id ? <>FB Pixel: <span className="font-mono">{campaign.fb_pixel_id}</span></> : "Tanpa FB Pixel"}
              </p>
            </div>
            <a href={`/campaign/${campaign.id}`} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-muted text-primary">
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          {/* Range filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {RANGE_OPTIONS.map(r => (
              <button
                key={r.days}
                onClick={() => setRangeDays(r.days)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-smooth ${
                  rangeDays === r.days ? "bg-primary text-primary-foreground shadow-button" : "bg-secondary hover:bg-secondary/80"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <StatCard icon={<Users className="h-5 w-5" />} label="Total Kunjungan" value={totalKunjungan.toLocaleString("id-ID")} sub={`${uniqueVisitor} unik`} />
            <StatCard icon={<FileText className="h-5 w-5" />} label="Mengisi Data" value={mengisiData.toLocaleString("id-ID")} />
            <StatCard icon={<UserCheck className="h-5 w-5" />} label="Total Donatur" value={totalDonatur.toLocaleString("id-ID")} />
            <StatCard icon={<Receipt className="h-5 w-5" />} label="Jumlah Transaksi" value={jumlahTransaksi.toLocaleString("id-ID")} />
            <StatCard icon={<Wallet className="h-5 w-5" />} label="Jumlah Donasi" value={formatRupiah(jumlahDonasi)} highlight />
            <StatCard icon={<Percent className="h-5 w-5" />} label="Persentase Donasi" value={`${persentase}%`} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="bg-card border border-border rounded-2xl p-5">
              <p className="font-bold text-sm mb-4">Total Donasi (transaksi/hari)</p>
              <div className="h-64">
                <ResponsiveContainer>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="count" name="Total donasi" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5">
              <p className="font-bold text-sm mb-4">Jumlah Donasi (Rp/hari)</p>
              <div className="h-64">
                <ResponsiveContainer>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => v >= 1000 ? `${v/1000}k` : v} />
                    <Tooltip formatter={(v: any) => formatRupiah(Number(v))} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="sum" name="Jumlah donasi" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Donatur table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <p className="font-bold">Daftar Donatur</p>
              <span className="text-xs text-muted-foreground">{filteredDonations.length} entri</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-bold">Tanggal</th>
                    <th className="px-4 py-3 font-bold">Nama</th>
                    <th className="px-4 py-3 font-bold">Nominal</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDonations.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Belum ada donasi pada rentang ini.</td></tr>
                  )}
                  {filteredDonations.map(d => (
                    <tr key={d.id} className="border-t border-border hover:bg-muted/30 transition-smooth">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(d.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3 font-semibold">{d.nama}</td>
                      <td className="px-4 py-3 font-bold text-primary whitespace-nowrap">{formatRupiah(d.nominal)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          d.status === "verified" ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"
                        }`}>
                          {d.status === "verified" ? "Berhasil" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

const StatCard = ({ icon, label, value, sub, highlight }: { icon: React.ReactNode; label: string; value: string; sub?: string; highlight?: boolean }) => (
  <div className={`rounded-2xl p-5 border ${highlight ? "bg-primary/5 border-primary/30" : "bg-card border-border"}`}>
    <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${highlight ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
      {icon}
    </div>
    <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">{label}</div>
    <div className={`font-display font-extrabold mt-1 ${highlight ? "text-2xl text-primary" : "text-2xl"}`}>{value}</div>
    {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
  </div>
);

export default AdminCampaignAnalytics;
