import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { Footer } from "./Footer";
import logoTerasDakwah from "@/assets/logo-teras-dakwah.png";

export const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 flex justify-center">
    <div className="w-full max-w-[480px] min-h-screen flex flex-col bg-background shadow-[0_0_60px_-10px_hsl(201_60%_25%/0.18)] relative">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/92 border-b border-border/50 shadow-header">
        <div className="px-4 flex h-[60px] items-center justify-between">
          <Link to="/" className="flex items-center group">
            <img
              src={logoTerasDakwah}
              alt="Teras Dakwah"
              className="h-8 w-auto group-hover:scale-105 transition-smooth"
            />
          </Link>
          <a
            href="https://wa.me/6285111514040"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold shadow-blue hover:bg-primary-dark transition-smooth flex items-center gap-1.5 tracking-wide"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>Tanya Program</span>
          </a>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  </div>
);
