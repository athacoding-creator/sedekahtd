import { Heart, Instagram, Facebook, Youtube, Twitter, Mail, MapPin } from "lucide-react";

export const Footer = () => (
  <footer className="mt-16">
    <div className="bg-secondary/50 border-t border-border">
      <div className="container py-12 text-center max-w-2xl">
        <h3 className="font-display text-xl font-extrabold mb-4">
          Social Media <span className="text-primary border-b-2 border-primary pb-1">BerkahKita</span>
        </h3>
        <div className="flex justify-center gap-3 mb-10">
          {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
            <a key={i} href="#" className="h-10 w-10 rounded-full bg-background border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-smooth">
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
        <div className="space-y-3">
          <div className="font-display font-extrabold tracking-wide">YAYASAN BERKAHKITA INDONESIA</div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" /> info@berkahkita.id
          </div>
          <div className="flex items-start justify-center gap-2 text-sm text-muted-foreground max-w-md mx-auto">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Jl. Kebaikan Blok B No. 12, Menteng, Jakarta Pusat, DKI Jakarta</span>
          </div>
        </div>
      </div>
    </div>
    <div className="bg-primary text-primary-foreground py-4 text-center text-xs">
      Copyright © {new Date().getFullYear()} BerkahKita. All Rights Reserved
    </div>
  </footer>
);
