import { Layout } from "@/components/Layout";
import { CampaignCard, Campaign } from "@/components/CampaignCard";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";

const CampaignList = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("Semua");

  useEffect(() => {
    supabase.from("campaigns").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setCampaigns((data as Campaign[]) ?? []));
  }, []);

  const cats = ["Semua", ...Array.from(new Set(campaigns.map(c => c.kategori).filter(Boolean) as string[]))];
  const filtered = campaigns.filter(c =>
    (cat === "Semua" || c.kategori === cat) &&
    c.judul.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <Layout>
      <section className="gradient-soft border-b border-border/60">
        <div className="container py-12 md:py-16 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-extrabold mb-3 animate-fade-in-up">Semua Campaign</h1>
          <p className="text-muted-foreground max-w-xl mx-auto animate-fade-in-up" style={{ animationDelay: "100ms", animationFillMode: "backwards" }}>
            Temukan campaign yang menggerakkan hatimu. Sebarkan kebaikan ke mereka yang membutuhkan.
          </p>
        </div>
      </section>

      <section className="container py-10">
        <div className="flex flex-col md:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Cari campaign..."
              className="w-full pl-11 pr-4 py-3 rounded-full bg-card border border-border focus:border-primary focus:outline-none transition-smooth"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {cats.map(c => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-smooth border ${
                  cat === c ? "bg-primary text-primary-foreground border-primary shadow-button" : "bg-card border-border hover:border-primary"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">Tidak ada campaign ditemukan.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((c, i) => <CampaignCard key={c.id} c={c} index={i} />)}
          </div>
        )}
      </section>
    </Layout>
  );
};

export default CampaignList;
