import { Layout } from "@/components/Layout";
import { CampaignCard, Campaign } from "@/components/CampaignCard";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Heart, ShieldCheck, Sparkles, Users } from "lucide-react";
import heroImg from "@/assets/hero-donation.jpg";

const Index = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    supabase.from("campaigns").select("*").order("created_at", { ascending: false }).limit(4)
      .then(({ data }) => setCampaigns((data as Campaign[]) ?? []));
  }, []);

  return (
    <Layout>
      {/* HERO */}
      <section className="relative overflow-hidden gradient-soft">
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute top-40 -left-24 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
        </div>
        <div className="container relative py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div className="animate-fade-in-up">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
              <Sparkles className="h-3.5 w-3.5" /> Platform sedekah amanah & transparan
            </span>
            <h1 className="font-display text-4xl md:text-6xl font-extrabold leading-[1.05] mb-5">
              Sedekahmu hari ini,<br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">berkah selamanya</span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg mb-8 max-w-lg">
              Salurkan kebaikanmu lewat donasi online yang mudah, cepat, dan transparan. Setiap rupiah yang kamu titipkan kami amanahkan langsung kepada yang membutuhkan.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/campaign" className="px-6 py-3.5 rounded-full gradient-hero text-primary-foreground font-semibold shadow-button hover:shadow-glow transition-smooth flex items-center gap-2 group">
                Mulai Donasi <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-smooth" />
              </Link>
              <Link to="/tentang" className="px-6 py-3.5 rounded-full bg-background border border-border font-semibold hover:bg-secondary transition-smooth">
                Pelajari Lebih
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-10 max-w-md">
              {[
                { n: "12K+", l: "Donatur" },
                { n: "Rp 8M+", l: "Tersalurkan" },
                { n: "50+", l: "Campaign" },
              ].map((s) => (
                <div key={s.l} className="text-center md:text-left">
                  <div className="font-display font-extrabold text-xl md:text-2xl text-primary">{s.n}</div>
                  <div className="text-xs text-muted-foreground">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative animate-scale-in">
            <div className="absolute inset-4 rounded-[2.5rem] gradient-hero blur-2xl opacity-30" />
            <img src={heroImg} alt="Donasi online amanah" className="relative rounded-[2rem] shadow-card w-full animate-float" />
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="container py-12">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: ShieldCheck, t: "100% Amanah", d: "Setiap donasi tercatat dan diverifikasi admin" },
            { icon: Heart, t: "Mudah & Cepat", d: "Donasi cukup dalam beberapa klik saja" },
            { icon: Users, t: "Transparan", d: "Laporan donasi terbuka untuk semua donatur" },
          ].map((f, i) => (
            <div key={f.t} className="p-6 rounded-2xl bg-card border border-border/60 shadow-soft hover:shadow-card hover:-translate-y-1 transition-smooth animate-fade-in-up" style={{ animationDelay: `${i * 100}ms`, animationFillMode: "backwards" }}>
              <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display font-bold mb-1">{f.t}</h3>
              <p className="text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CAMPAIGNS */}
      <section className="container py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold mb-2">Campaign Pilihan</h2>
            <p className="text-muted-foreground">Pilih campaign yang ingin kamu dukung hari ini</p>
          </div>
          <Link to="/campaign" className="hidden md:inline-flex items-center gap-1 text-primary font-semibold hover:gap-2 transition-all">
            Lihat semua <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {campaigns.map((c, i) => <CampaignCard key={c.id} c={c} index={i} />)}
        </div>
      </section>

      {/* CTA */}
      <section className="container py-16">
        <div className="relative overflow-hidden rounded-3xl gradient-hero p-10 md:p-14 text-primary-foreground">
          <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
          <div className="relative max-w-2xl">
            <h3 className="font-display text-3xl md:text-4xl font-extrabold mb-3">Mari berbagi, mari berkah</h3>
            <p className="opacity-90 mb-6">Sebaik-baik manusia adalah yang paling bermanfaat bagi sesama. Mulai sedekah online hari ini.</p>
            <Link to="/campaign" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-background text-primary font-semibold hover:scale-105 transition-smooth">
              Donasi Sekarang <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
