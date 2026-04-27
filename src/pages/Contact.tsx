import { Layout } from "@/components/Layout";
import { Mail, MapPin, Phone } from "lucide-react";

const Contact = () => (
  <Layout>
    <section className="gradient-soft border-b border-border/60">
      <div className="container py-16 text-center">
        <h1 className="font-display text-4xl md:text-5xl font-extrabold mb-3 animate-fade-in-up">Hubungi Kami</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">Punya pertanyaan atau ingin berkolaborasi? Tim kami siap membantu.</p>
      </div>
    </section>
    <section className="container py-16 grid md:grid-cols-3 gap-5 max-w-4xl">
      {[
        { icon: Mail, t: "Email", d: "halo@berkahkita.id" },
        { icon: Phone, t: "Telepon", d: "+62 812 3456 7890" },
        { icon: MapPin, t: "Alamat", d: "Jakarta, Indonesia" },
      ].map((f, i) => (
        <div key={f.t} className="p-6 rounded-3xl bg-card border border-border/60 shadow-soft hover:shadow-card hover:-translate-y-1 transition-smooth animate-fade-in-up text-center" style={{ animationDelay: `${i * 100}ms`, animationFillMode: "backwards" }}>
          <div className="h-12 w-12 mx-auto rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <f.icon className="h-5 w-5" />
          </div>
          <div className="font-display font-bold mb-1">{f.t}</div>
          <div className="text-sm text-muted-foreground">{f.d}</div>
        </div>
      ))}
    </section>
  </Layout>
);

export default Contact;
