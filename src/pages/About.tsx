import { Layout } from "@/components/Layout";
import { Heart, ShieldCheck, Users, Sparkles } from "lucide-react";

const About = () => (
  <Layout>
    <section className="gradient-soft border-b border-border/60">
      <div className="container py-16 text-center">
        <h1 className="font-display text-4xl md:text-5xl font-extrabold mb-3 animate-fade-in-up">Tentang BerkahKita</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "100ms", animationFillMode: "backwards" }}>
          Platform sedekah online yang menjembatani kebaikanmu kepada saudara-saudara yang membutuhkan, dengan amanah, transparan, dan mudah.
        </p>
      </div>
    </section>
    <section className="container py-16 grid md:grid-cols-2 gap-10 items-center">
      <div className="animate-fade-in-up">
        <h2 className="font-display text-3xl font-extrabold mb-4">Misi Kami</h2>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          Membangun ekosistem sedekah digital yang mudah diakses siapa saja, kapan saja. Setiap donasi yang dititipkan adalah amanah yang kami jaga dan salurkan tepat sasaran.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Kami percaya teknologi mampu memperluas dampak kebaikan. Bersama, mari wujudkan Indonesia yang lebih peduli dan saling tolong menolong.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[
          { icon: ShieldCheck, t: "Amanah", d: "Diverifikasi tim kami" },
          { icon: Heart, t: "Empati", d: "Hadir untuk yang butuh" },
          { icon: Users, t: "Komunitas", d: "12K+ donatur aktif" },
          { icon: Sparkles, t: "Transparan", d: "Laporan terbuka" },
        ].map((f, i) => (
          <div key={f.t} className="p-5 rounded-2xl bg-card border border-border/60 shadow-soft hover:shadow-card hover:-translate-y-1 transition-smooth animate-fade-in-up" style={{ animationDelay: `${i * 80}ms`, animationFillMode: "backwards" }}>
            <f.icon className="h-6 w-6 text-primary mb-2" />
            <div className="font-display font-bold">{f.t}</div>
            <div className="text-xs text-muted-foreground">{f.d}</div>
          </div>
        ))}
      </div>
    </section>
  </Layout>
);

export default About;
