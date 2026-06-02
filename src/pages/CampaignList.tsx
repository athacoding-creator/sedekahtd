import { Layout } from "@/components/Layout";
import { CampaignCard, Campaign } from "@/components/CampaignCard";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";

const CampaignList = () => {
  const [kategoriList, setKategoriList] = useState<string[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("Semua");

  useEffect(() => {
    (supabase as any).from("campaigns").select("*")
      .order("is_pinned", { ascending: false })
      .order("urutan", { ascending: true })
      .order("is_pilihan", { ascending: false })
      .order("jumlah_donatur", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }: any) => setCampaigns((data as Campaign[]) ?? []));
    (supabase as any).from("categories").select("nama").eq("aktif", true).order("urutan")
      .then(({ data }: any) => setKategoriList((data ?? []).map((c: any) => c.nama)));
  }, []);

  const filtered = campaigns.filter(c =>
    (cat === "Semua" || c.kategori === cat) &&
    c.judul.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <Layout>
      <section className="py-6 px-4">
        <div className="container max-w-3xl">
          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Cari campaign..."
              className="w-full pl-11 pr-4 py-3 rounded-full bg-card border border-border focus:border-primary focus:outline-none text-sm transition-smooth shadow-soft"
            />
          </div>

          {/* Kategori filter */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-5">
            {/* Dynamic categories */}
            {["Semua", ...kategoriList].map(k => (
              <button
                key={k}
                onClick={() => setCat(k)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-smooth border ${
                  cat === k
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card border-border text-slate-600 hover:border-primary"
                }`}
              >
                {k}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">Tidak ada campaign ditemukan.</div>
          ) : (
            <div className="space-y-4">
              {filtered.map((c, i) => <CampaignCard key={c.id} c={c} index={i} />)}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default CampaignList;
