import { Instagram, Facebook, Youtube, Mail, MapPin } from "lucide-react";

const socials = [
  { Icon: Facebook, href: "https://www.facebook.com/TerasDakwah" },
  { Icon: Instagram, href: "https://www.instagram.com/terasdakwah/" },
  { Icon: Youtube, href: "https://www.youtube.com/@terasdakwah" },
];
import logoTerasDakwah from "@/assets/logo-teras-dakwah.png";

export const Footer = () => (
  <footer className="mt-16">
    <div className="bg-secondary/50 border-t border-border">
      <div className="container py-12 text-center max-w-2xl">
        <img src={logoTerasDakwah} alt="Teras Dakwah" className="h-10 w-auto mx-auto mb-6" />
        <h3 className="font-display text-xl font-extrabold mb-4">
          Social Media <span className="text-primary border-b-2 border-primary pb-1">Teras Dakwah</span>
        </h3>
        <div className="flex justify-center gap-3 mb-10">
          {socials.map(({ Icon, href }, i) => (
            <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full bg-background border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-smooth">
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
        <div className="space-y-3">
          <div className="font-display font-extrabold tracking-wide">YAYASAN TERAS DAKWAH</div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" /> info@terasdakwah.com
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>Jalan Nitikan UH VI / 413 RT 41 RW 11, Kel. Sorosutan Kec. Umbulharjo, Yogyakarta</span>
          </div>
        </div>
      </div>
    </div>
    <div className="bg-primary text-primary-foreground py-4 text-center text-xs">
     © 2014 Teras Dakwah. All Rights Reserved.
    </div>
  </footer>
);
