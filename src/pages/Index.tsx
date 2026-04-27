import { Layout } from "@/components/Layout";
import { CampaignCard, Campaign } from "@/components/CampaignCard";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatRupiah } from "@/lib/format";
import bannerHero from "@/assets/banner-hero.jpg";

type PublicDonation = {
  id: string;
  nama: string;
  nominal: number;
  pesan: string | null;
  created_at: string;
};

const timeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "hari ini";
  if (days < 7) return `${days} hari yang lalu`;
  if (days < 30) return `${Math.floor(days / 7)} minggu yang lalu`;
  if (days < 365) return `${Math.floor(days / 30)} bulan yang lalu`;
  return `${Math.floor(days / 365)} tahun yang lalu`;
};

const Index = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [donations, setDonations] = useState<PublicDonation[]>([]);
  const [stats, setStats] = useState({ total: 0, jumlah: 0, aktif: 0 });
  const [showAllDonors, setShowAllDonors] = useState(false);
  const [showAllCampaigns, setShowAllCampaigns] = useState(false);

  useEffect(() => {
    supabase.from("campaigns").select("*").order("created_at", { ascending: false })
      .then(({ data }) => {
        const list = (data as Campaign[]) ?? [];
        setCampaigns(list);
        const total = list.reduce((a, b) => a + Number(b.terkumpul), 0);
        setStats(s => ({ ...s, total, aktif: list.length }));
      });

    supabase.from("public_donations").select("*").limit(50)
      .then(({ data }) => {
        const list = (data as PublicDonation[]) ?? [];
        setDonations(list);
        setStats(s => ({ ...s, jumlah: list.length }));
      });
  }, []);

  const programPilihan = campaigns.slice(0, 3);
  const programLainnya = showAllCampaigns ? campaigns : campaigns.slice(0, 5);
  const visibleDonors = showAllDonors ? donations : donations.slice(0, 5);

  return (
    <Layout>
      {/* HERO BANNER */}
      <section className="bg-secondary/40 pt-6 pb-4">
        <div className="container max-w-4xl">
          <div className="relative rounded-3xl overflow-hidden shadow-card aspect-[16/9] sm:aspect-[21/9] animate-fade-in">
            <img src={bannerHero} alt="Sedekah Jum'at - Pahala Berlipat" className="absolute inset-0 h-full w-full object-cover" />
            {/* Logo overlays */}
            <div className="absolute top-4 left-4 flex gap-2">
              <div className="px-3 py-1.5 rounded-full bg-white/95 backdrop-blur text-[10px] font-bold text-primary-dark shadow-soft">
                ⌂ Baitulmaal
              </div>
              <div className="px-3 py-1.5 rounded-full bg-white/95 backdrop-blur text-[10px] font-bold text-primary-dark shadow-soft">
                🕌 Masjid
              </div>
            </div>
            {/* CTA tombol kuning */}
            <button className="absolute bottom-4 right-4 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full bg-accent text-accent-foreground font-extrabold text-xs sm:text-sm shadow-button hover:scale-105 transition-smooth uppercase tracking-wide">
              Sedekah Sekarang
            </button>
            {/* Carousel arrows (decorative) */}
            <button className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 backdrop-blur text-primary flex items-center justify-center shadow-soft hover:bg-white">‹</button>
            <button className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 backdrop-blur text-primary flex items-center justify-center shadow-soft hover:bg-white">›</button>
          </div>

          {/* Stats bar */}
          <div className="bg-card rounded-2xl shadow-card border border-border/60 mt-5 grid grid-cols-3 divide-x divide-border overflow-hidden animate-fade-in-up">
            {[
              { l: "Total Donasi", v: formatRupiah(stats.total) },
              { l: "Jumlah Donasi", v: stats.jumlah.toLocaleString("id-ID") },
              { l: "Aktif Program", v: stats.aktif },
            ].map(s => (
              <div key={s.l} className="py-4 px-2 text-center">
                <div className="text-[11px] text-muted-foreground mb-1">{s.l}</div>
                <div className="font-display font-extrabold text-sm sm:text-base text-foreground">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROGRAM PILIHAN */}
      <section className="py-12">
        <div className="container max-w-4xl">
          <div className="text-center mb-8 animate-fade-in-up">
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold mb-2">Program Pilihan</h2>
            <p className="text-sm text-muted-foreground">Program prioritas yang membutuhkan</p>
          </div>
          {/* Carousel of small cards */}
          <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 -mx-4 px-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible">
            {programPilihan.map((c, i) => (
              <Link
                key={c.id}
                to={`/campaign/${c.id}`}
                className="group flex-shrink-0 w-[80%] sm:w-auto snap-center bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-card border border-border/60 transition-smooth hover:-translate-y-1 animate-fade-in-up"
                style={{ animationDelay: `${i * 80}ms`, animationFillMode: "backwards" }}
              >
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  <img src={c.gambar_url ?? "/placeholder.svg"} alt={c.judul} loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition-smooth duration-500" />
                </div>
                <div className="p-4">
                  <h3 className="font-display font-bold text-sm leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-smooth">{c.judul}</h3>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-2">
                    YAYASAN BERKAHKITA <span className="text-primary">✓</span>
                  </div>
                  <div className="text-sm font-bold text-primary mb-2">
                    {formatRupiah(c.terkumpul)} <span className="text-[10px] font-normal text-muted-foreground">terkumpul</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-progress rounded-full" style={{ width: `${Math.min(100, (c.terkumpul / Math.max(1, c.target)) * 100)}%` }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="flex justify-center gap-1.5 mt-2">
            <span className="h-1.5 w-6 rounded-full bg-primary"></span>
            <span className="h-1.5 w-1.5 rounded-full bg-border"></span>
          </div>
        </div>
      </section>

      {/* PROGRAM BERKAHKITA */}
      <section className="py-12 bg-secondary/40 border-y border-border/60">
        <div className="container max-w-3xl">
          <div className="text-center mb-8 animate-fade-in-up">
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold mb-2">Program BerkahKita</h2>
            <p className="text-sm text-muted-foreground">Recharge iman dengan program-program BerkahKita</p>
          </div>
          <div className="space-y-4">
            {programLainnya.map((c, i) => <CampaignCard key={c.id} c={c} index={i} />)}
          </div>
          {!showAllCampaigns && campaigns.length > 5 && (
            <div className="text-center mt-8">
              <button onClick={() => setShowAllCampaigns(true)} className="px-8 py-2.5 rounded-full border-2 border-primary text-primary font-semibold text-sm hover:bg-primary hover:text-primary-foreground transition-smooth">
                Load more
              </button>
            </div>
          )}
          {showAllCampaigns && (
            <div className="text-center mt-8">
              <Link to="/campaign" className="px-8 py-2.5 rounded-full border-2 border-primary text-primary font-semibold text-sm hover:bg-primary hover:text-primary-foreground transition-smooth">
                Lihat semua campaign
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ORANG-ORANG BAIK */}
      <section className="py-12">
        <div className="container max-w-3xl">
          <div className="text-center mb-8 animate-fade-in-up">
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold mb-2">#orang-orang baik</h2>
            <p className="text-sm text-muted-foreground">Berkumpul memberikan bantuan terbaik</p>
          </div>
          <div className="bg-secondary/40 rounded-3xl p-4 sm:p-6 space-y-3">
            {visibleDonors.length === 0 && (
              <div className="text-center py-12 text-sm text-muted-foreground">Belum ada donatur. Jadilah yang pertama!</div>
            )}
            {visibleDonors.map((d, i) => (
              <div key={d.id} className="bg-card rounded-2xl p-4 shadow-soft border border-border/60 animate-fade-in-up" style={{ animationDelay: `${i * 50}ms`, animationFillMode: "backwards" }}>
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="font-display font-bold text-sm">{d.nama}</div>
                  <div className="text-[11px] text-muted-foreground whitespace-nowrap">{timeAgo(d.created_at)}</div>
                </div>
                <div className="text-sm text-muted-foreground mb-1">
                  Donasi <span className="font-bold text-primary">{formatRupiah(d.nominal)}</span>
                </div>
                {d.pesan && <div className="text-xs text-muted-foreground italic">"{d.pesan}"</div>}
              </div>
            ))}
            {donations.length > 5 && !showAllDonors && (
              <div className="text-center pt-4">
                <button onClick={() => setShowAllDonors(true)} className="px-8 py-2.5 rounded-full bg-foreground text-background font-semibold text-sm hover:opacity-90 transition-smooth">
                  Loadmore
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* TENTANG */}
      <section className="py-12">
        <div className="container max-w-2xl text-center">
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold mb-2 animate-fade-in-up">Tentang BerkahKita</h2>
          <p className="text-sm text-muted-foreground mb-6">Tempat sedekah amanah dan transparan untuk umat</p>
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed text-left">
            <p>Yayasan BerkahKita Indonesia, sebagai salah satu penggerak kebaikan sejak tahun 2011.</p>
            <p>Manfaat untuk umat dan masyarakat menjadi salah satu tagline kami dalam bergerak, dan kami pun memiliki prinsip bahwa semakin banyak penerima manfaat, semakin banyak pula saksi kita di hari akhirat. Berarti harus selalu bergerak dan bermanfaat bagi manusia sekitarnya.</p>
            <p>Apalagi sebaik-baiknya manusia adalah yang bermanfaat bagi sesama, maka BerkahKita berkomitmen memberikan pelayanan terbaik dalam hal Dakwah, sosial kemanusiaan dan juga perekonomian umat.</p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
