import { Instagram, Facebook, Youtube, Mail } from "lucide-react";
import logoTerasDakwah from "@/assets/logo-teras-dakwah.png";

const socials = [
  { Icon: Facebook, href: "https://www.facebook.com/TerasDakwah", label: "Facebook" },
  { Icon: Instagram, href: "https://www.instagram.com/terasdakwah/", label: "Instagram" },
  { Icon: Youtube, href: "https://www.youtube.com/@terasdakwah", label: "YouTube" },
];

export const Footer = () => (
  <footer className="mt-12">
    <div className="bg-gradient-to-b from-slate-50 to-slate-100 border-t border-slate-200">
      <div className="container py-10 text-center max-w-2xl px-6">
        <img src={logoTerasDakwah} alt="Teras Dakwah" className="h-9 w-auto mx-auto mb-5 opacity-90" />

        <h3 className="font-display text-lg font-bold mb-4 text-slate-700">
          Social Media <span className="text-primary">Teras Dakwah</span>
        </h3>

        <div className="flex justify-center gap-2.5 mb-8">
          {socials.map(({ Icon, href, label }, i) => (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="h-9 w-9 rounded-full bg-white border border-slate-200 shadow-soft flex items-center justify-center text-slate-500 hover:bg-primary hover:text-white hover:border-primary hover:shadow-blue transition-smooth"
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>

        <div className="space-y-2.5">
          <div className="font-display font-bold text-sm tracking-widest text-slate-700 uppercase">
            Yayasan Teras Dakwah
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <Mail className="h-3.5 w-3.5 flex-shrink-0" />
            <span>info@terasdakwah.com</span>
          </div>
          <div className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            Jalan Nitikan UH VI / 413 RT 41 RW 11, Kel. Sorosutan Kec. Umbulharjo, Yogyakarta
          </div>
        </div>
      </div>
    </div>
    <div className="bg-primary text-white py-3.5 text-center text-[11px] font-medium tracking-wide">
      © 2014 Teras Dakwah. All Rights Reserved.
    </div>
  </footer>
);
