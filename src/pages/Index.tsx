import { Layout } from "@/components/Layout";
import { CampaignCard, Campaign } from "@/components/CampaignCard";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatRupiah } from "@/lib/format";
import bannerHero from "@/assets/banner-hero.jpg";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import CountUp from "react-countup";

const DEFAULT_KATEGORI = ["Semua"];

type PublicDonation = {
  id: string;
  nama: string;
  nominal: number;
  pesan: string | null;
  created_at: string;
};

type HeroSlide = {
  id: string;
  judul: string;
  gambar_url: string;
  link_url: string | null;
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
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [showAllDonors, setShowAllDonors] = useState(false);
  const [showAllCampaigns, setShowAllCampaigns] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [kategoriList, setKategoriList] = useState<string[]>(["Semua"]);
  const [selectedKat, setSelectedKat] = useState("Semua");

  useEffect(() => {
    // Load hero slides from database
    supabase
      .from("heroes")
      .select("id, judul, gambar_url, link_url")
      .eq("aktif", true)
      .order("urutan", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setHeroSlides(data as HeroSlide[]);
        } else {
          // Fallback to default banner if no heroes in DB
          setHeroSlides([{
            id: "default",
            judul: "Sedekah Sekarang",
            gambar_url: bannerHero,
            link_url: "/campaign",
          }]);
        }
      });

    // Load campaigns with real-time subscription
    (supabase as any).from("campaigns").select("*").order("created_at", { ascending: false })
      .then(({ data }) => {
        const list = (data as Campaign[]) ?? [];
        setCampaigns(list);
        const total = list.reduce((a, b) => a + Number(b.terkumpul), 0);
        setStats(s => ({ ...s, total, aktif: list.length }));
        // Build dynamic categories
        const cats = Array.from(new Set(list.map(c => c.kategori).filter(Boolean))) as string[];
        setKategoriList(["Semua", ...cats]);
      });

    // Load donation count (exact) and recent donations
    supabase.from("donations").select("id", { count: "exact", head: true }).eq("status", "verified")
      .then(({ count }) => {
        setStats(s => ({ ...s, jumlah: count ?? 0 }));
      });

    supabase.from("public_donations").select("*").limit(50)
      .then(({ data }) => {
        setDonations((data as PublicDonation[]) ?? []);
      });

    // Real-time: update campaign terkumpul & stats jumlah saat donasi diverifikasi
    const channel = supabase
      .channel("index-realtime")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "campaigns" }, (payload) => {
        setCampaigns(prev => {
          const updated = prev.map(c =>
            c.id === payload.new.id ? { ...c, terkumpul: (payload.new as Campaign).terkumpul } : c
          );
          const total = updated.reduce((a, b) => a + Number(b.terkumpul), 0);
          setStats(s => ({ ...s, total }));
          return updated;
        });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "donations" }, () => {
        supabase.from("donations").select("id", { count: "exact", head: true }).eq("status", "verified")
          .then(({ count }) => setStats(s => ({ ...s, jumlah: count ?? 0 })));
        supabase.from("public_donations").select("*").limit(50)
          .then(({ data }) => setDonations((data as PublicDonation[]) ?? []));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "donations" }, () => {
        supabase.from("donations").select("id", { count: "exact", head: true }).eq("status", "verified")
          .then(({ count }) => setStats(s => ({ ...s, jumlah: count ?? 0 })));
        supabase.from("public_donations").select("*").limit(50)
          .then(({ data }) => setDonations((data as PublicDonation[]) ?? []));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const programPilihan = campaigns.filter(c => c.is_pilihan);
  const filteredCampaigns = campaigns.filter(c =>
    (selectedKat === "Semua" || c.kategori === selectedKat) &&
    c.judul.toLowerCase().includes(searchQ.toLowerCase())
  );
  const programLainnya = showAllCampaigns ? filteredCampaigns : filteredCampaigns.slice(0, 5);
  const visibleDonors = showAllDonors ? donations : donations.slice(0, 5);

  // Hero carousel
  const [heroIdx, setHeroIdx] = useState(0);
  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const t = setInterval(() => setHeroIdx(i => (i + 1) % heroSlides.length), 5000);
    return () => clearInterval(t);
  }, [heroSlides.length]);
  const heroPrev = () => setHeroIdx(i => (i - 1 + heroSlides.length) % heroSlides.length);
  const heroNext = () => setHeroIdx(i => (i + 1) % heroSlides.length);

  // Program Pilihan scroller
  const pilihanRef = useRef<HTMLDivElement>(null);
  const scrollPilihan = (dir: "left" | "right") => {
    const el = pilihanRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };



  const currentHero = heroSlides[heroIdx];

  return (
    <Layout>
      {/* HERO BANNER */}
      <section className="bg-gradient-to-b from-sky-50 to-slate-50 pt-5 pb-5">
        <div className="container max-w-4xl px-4">
          {/* Hero Carousel */}
          <div className="relative rounded-2xl overflow-hidden shadow-card animate-fade-in" style={{ aspectRatio: "16/12" }}>
            {heroSlides.map((slide, i) => (
              <img
                key={slide.id}
                src={slide.gambar_url}
                alt={slide.judul}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${i === heroIdx ? "opacity-100" : "opacity-0"}`}
              />
            ))}

            {/* Gradient overlay bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            {/* Gradient overlay top-left for badges */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-transparent pointer-events-none" />

            {/* Category badges */}
            <div className="absolute top-3 left-3 flex gap-1.5">
              <div className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-semibold text-slate-700 shadow-soft">
                ⌂ Baitulmaal
              </div>
              <div className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-semibold text-slate-700 shadow-soft">
                🕌 Masjid
              </div>
            </div>

            {/* CTA button */}
            {currentHero && (
              <Link
                to={currentHero.link_url ?? "/campaign"}
                className="absolute bottom-4 right-4 px-5 py-2.5 rounded-full bg-accent text-accent-foreground font-bold text-[11px] shadow-button hover:scale-105 transition-smooth uppercase tracking-widest"
              >
                Sedekah Sekarang
              </Link>
            )}

            {/* Carousel arrows */}
            {heroSlides.length > 1 && (
              <>
                <button
                  onClick={heroPrev}
                  aria-label="Sebelumnya"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/85 backdrop-blur-sm text-slate-700 flex items-center justify-center shadow-card hover:bg-white hover:scale-110 transition-smooth"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={heroNext}
                  aria-label="Berikutnya"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/85 backdrop-blur-sm text-slate-700 flex items-center justify-center shadow-card hover:bg-white hover:scale-110 transition-smooth"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}

            {/* Dots */}
            {heroSlides.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {heroSlides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setHeroIdx(i)}
                    aria-label={`Slide ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === heroIdx ? "w-6 bg-white" : "w-1.5 bg-white/50"}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="mt-4 bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden animate-fade-in-up">
            <div className="flex flex-row">
              <div className="flex flex-col items-center justify-center py-4 px-3 flex-1 min-w-0">
                <span className="text-[11px] text-slate-500 font-medium text-center leading-tight">Total Donasi</span>
                <span className="font-display font-bold text-lg text-slate-800 tracking-tight leading-tight mt-1">
                  Rp <CountUp end={stats.total} duration={2} separator="." useEasing />
                </span>
              </div>
              <div className="flex flex-col items-center justify-center py-4 px-3 flex-1 min-w-0">
                <span className="text-[11px] text-slate-500 font-medium text-center leading-tight">Jumlah Donasi</span>
                <span className="font-display font-bold text-lg text-slate-800 tracking-tight leading-tight mt-1">
                  <CountUp end={stats.jumlah} duration={2} separator="." useEasing />
                </span>
              </div>
              <div className="flex flex-col items-center justify-center py-4 px-3 flex-1 min-w-0">
                <span className="text-[11px] text-slate-500 font-medium text-center leading-tight">Aktif Program</span>
                <span className="font-display font-bold text-lg text-slate-800 tracking-tight leading-tight mt-1">
                  <CountUp end={stats.aktif} duration={2} useEasing />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROGRAM PILIHAN */}
      <section className="py-10">
        <div className="container max-w-4xl px-4">
          <div className="text-center mb-6 animate-fade-in-up">
            <h2 className="font-display text-2xl font-bold mb-1.5 text-slate-800">Program Pilihan</h2>
            <p className="text-sm text-slate-500">Program prioritas yang membutuhkan</p>
          </div>
          <div className="relative">
            {/* Arrow buttons */}
            <button
              onClick={() => scrollPilihan("left")}
              aria-label="Geser kiri"
              className="hidden sm:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white shadow-card text-primary items-center justify-center hover:scale-110 transition-smooth border border-slate-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scrollPilihan("right")}
              aria-label="Geser kanan"
              className="hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white shadow-card text-primary items-center justify-center hover:scale-110 transition-smooth border border-slate-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Scroller */}
            {programPilihan.length === 0 ? (
              <div className="text-center py-10 text-sm text-slate-400 bg-white rounded-2xl border border-slate-100">
                Belum ada program pilihan untuk saat ini.
              </div>
            ) : (
            <div
              ref={pilihanRef}
              className="flex gap-3.5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-3 -mx-4 px-4 scroll-smooth"
            >
              {programPilihan.map((c, i) => (
                <Link
                  key={c.id}
                  to={`/campaign/${c.id}`}
                  className="group flex-shrink-0 w-[78%] sm:w-[calc(33.333%-0.667rem)] snap-center bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-card border border-slate-100/80 transition-smooth hover:-translate-y-1 animate-fade-in-up"
                  style={{ animationDelay: `${i * 80}ms`, animationFillMode: "backwards" }}
                >
                  <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                    <img
                      src={c.gambar_url ?? "/placeholder.svg"}
                      alt={c.judul}
                      loading="lazy"
                      className="h-full w-full object-cover group-hover:scale-105 transition-smooth duration-500"
                    />
                  </div>
                  <div className="p-3.5">
                    <h3 className="font-display font-bold text-[13px] leading-snug mb-1.5 line-clamp-2 text-slate-800 group-hover:text-primary transition-smooth">{c.judul}</h3>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-2">
                      YAYASAN TERAS DAKWAH <span className="text-primary">✓</span>
                    </div>
                    <div className="text-sm font-bold text-primary mb-2">
                      {formatRupiah(c.terkumpul)} <span className="text-[10px] font-normal text-slate-400">terkumpul</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, (c.terkumpul / Math.max(1, c.target)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            )}
          </div>
        </div>
      </section>

      {/* PROGRAM TERAS DAKWAH */}
      <section className="py-10 bg-gradient-to-b from-slate-50 to-sky-50/60 border-y border-slate-100">
        <div className="container max-w-3xl px-4">
          <div className="text-center mb-5 animate-fade-in-up">
            <h2 className="font-display text-2xl font-bold mb-1.5 text-slate-800">Program Teras Dakwah</h2>
            <p className="text-sm text-slate-500">Recharge iman dengan program-program Teras Dakwah</p>
          </div>

          {/* Search bar */}
          <div className="relative mb-3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={searchQ}
              onChange={e => { setSearchQ(e.target.value); setShowAllCampaigns(false); }}
              placeholder="Cari campaign..."
              className="w-full pl-11 pr-4 py-3 rounded-full bg-white border border-slate-200 focus:border-primary focus:outline-none text-sm shadow-soft transition-smooth"
            />
          </div>

          {/* Filter kategori */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-5">
            {KATEGORI.map(k => (
              <button
                key={k}
                onClick={() => { setSelectedKat(k); setShowAllCampaigns(false); }}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-smooth border ${
                  selectedKat === k
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:border-primary"
                }`}
              >
                {k}
              </button>
            ))}
          </div>

          <div className="space-y-3.5">
            {programLainnya.length === 0 ? (
              <div className="text-center py-12 text-sm text-slate-400 bg-white rounded-2xl border border-slate-100">Tidak ada campaign ditemukan.</div>
            ) : (
              programLainnya.map((c, i) => <CampaignCard key={c.id} c={c} index={i} />)
            )}
          </div>
          {!showAllCampaigns && filteredCampaigns.length > 5 && (
            <div className="text-center mt-8">
              <button
                onClick={() => setShowAllCampaigns(true)}
                className="px-8 py-2.5 rounded-full border-2 border-primary text-primary font-semibold text-sm hover:bg-primary hover:text-white transition-smooth"
              >
                Load more
              </button>
            </div>
          )}
          {showAllCampaigns && (
            <div className="text-center mt-8">
              <Link
                to="/campaign"
                className="px-8 py-2.5 rounded-full border-2 border-primary text-primary font-semibold text-sm hover:bg-primary hover:text-white transition-smooth"
              >
                Lihat semua campaign
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ORANG-ORANG BAIK */}
      <section className="py-10">
        <div className="container max-w-3xl px-4">
          <div className="text-center mb-6 animate-fade-in-up">
            <h2 className="font-display text-2xl font-bold mb-1.5 text-slate-800">#orang-orang baik</h2>
            <p className="text-sm text-slate-500">Berkumpul memberikan bantuan terbaik</p>
          </div>
          <div className="space-y-3">
            {donations.length === 0 && (
              <div className="text-center py-12 text-sm text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                Belum ada donatur. Jadilah yang pertama!
              </div>
            )}
            {visibleDonors.map((d, i) => (
              <div
                key={d.id}
                className="bg-white rounded-2xl p-4 shadow-soft border border-slate-100 animate-fade-in-up hover:shadow-card transition-smooth"
                style={{ animationDelay: `${i * 50}ms`, animationFillMode: "backwards" }}
              >
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="font-display font-bold text-sm text-slate-800">{d.nama}</div>
                  <div className="text-[11px] text-slate-400 whitespace-nowrap">{timeAgo(d.created_at)}</div>
                </div>
                <div className="text-sm text-slate-500 mb-1">
                  Donasi <span className="font-bold text-primary">{formatRupiah(d.nominal)}</span>
                </div>
                {d.pesan && <div className="text-xs text-slate-400 italic mt-1">"{d.pesan}"</div>}
              </div>
            ))}
            {donations.length > 5 && !showAllDonors && (
              <div className="text-center pt-4">
                <button
                  onClick={() => setShowAllDonors(true)}
                  className="px-8 py-2.5 rounded-full bg-slate-800 text-white font-semibold text-sm hover:bg-slate-700 transition-smooth shadow-soft"
                >
                  Loadmore
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* TENTANG */}
      <section className="py-10 bg-gradient-to-b from-sky-50/60 to-slate-50">
        <div className="container max-w-2xl px-4 text-center">
          <h2 className="font-display text-2xl font-bold mb-1.5 text-slate-800 animate-fade-in-up">Tentang Teras Dakwah</h2>
          <p className="text-sm text-slate-500 mb-6">Tempat sedekah amanah dan transparan untuk umat</p>
          <div className="space-y-4 text-sm text-slate-500 leading-relaxed text-left bg-white rounded-2xl p-6 shadow-soft border border-slate-100">
            <p>Yayasan Teras Dakwah, sebagai salah satu penggerak kebaikan sejak tahun 2011.</p>
            <p>Manfaat untuk umat dan masyarakat menjadi salah satu tagline kami dalam bergerak, dan kami pun memiliki prinsip bahwa semakin banyak penerima manfaat, semakin banyak pula saksi kita di hari akhirat. Berarti harus selalu bergerak dan bermanfaat bagi manusia sekitarnya.</p>
            <p>Apalagi sebaik-baiknya manusia adalah yang bermanfaat bagi sesama, maka Teras Dakwah berkomitmen memberikan pelayanan terbaik dalam hal Dakwah, sosial kemanusiaan dan juga perekonomian umat.</p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
