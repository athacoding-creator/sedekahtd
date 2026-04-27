import { Heart, Instagram, Facebook, Youtube } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => (
  <footer className="border-t border-border/60 bg-secondary/40 mt-20">
    <div className="container py-12 grid gap-10 md:grid-cols-3">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-9 w-9 rounded-xl gradient-hero flex items-center justify-center">
            <Heart className="h-4 w-4 text-primary-foreground fill-primary-foreground" />
          </div>
          <span className="font-display font-extrabold">BerkahKita</span>
        </div>
        <p className="text-sm text-muted-foreground max-w-xs">
          Platform donasi online amanah & transparan untuk menebar manfaat ke seluruh negeri.
        </p>
      </div>
      <div>
        <h4 className="font-display font-bold mb-4 text-sm">Navigasi</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><Link to="/" className="hover:text-primary transition-smooth">Home</Link></li>
          <li><Link to="/campaign" className="hover:text-primary transition-smooth">Campaign</Link></li>
          <li><Link to="/tentang" className="hover:text-primary transition-smooth">Tentang</Link></li>
          <li><Link to="/kontak" className="hover:text-primary transition-smooth">Kontak</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="font-display font-bold mb-4 text-sm">Ikuti Kami</h4>
        <div className="flex gap-3">
          {[Instagram, Facebook, Youtube].map((Icon, i) => (
            <a key={i} href="#" className="h-10 w-10 rounded-xl bg-background border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-smooth">
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>
    </div>
    <div className="border-t border-border/60">
      <div className="container py-5 text-xs text-muted-foreground text-center">
        © {new Date().getFullYear()} BerkahKita. Sedekah jariyah online — amanah & transparan.
      </div>
    </div>
  </footer>
);
