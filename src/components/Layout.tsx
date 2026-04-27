import { Link } from "react-router-dom";
import { Heart, MessageCircle } from "lucide-react";
import { Footer } from "./Footer";

export const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/90 border-b border-border/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="h-9 w-9 rounded-xl gradient-banner shadow-blue flex items-center justify-center group-hover:scale-110 transition-smooth">
            <Heart className="h-4 w-4 text-primary-foreground fill-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="font-display font-extrabold text-base">Berkah<span className="text-primary">Kita</span></div>
            <div className="text-[10px] text-muted-foreground -mt-0.5">Sedekah jariyah online</div>
          </div>
        </Link>
        <a
          href="https://wa.me/6281234567890"
          target="_blank"
          rel="noreferrer"
          className="px-3 sm:px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-semibold shadow-blue hover:bg-primary-dark transition-smooth flex items-center gap-1.5 sm:gap-2"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="hidden xs:inline sm:inline">Tanya Program</span>
          <span className="xs:hidden sm:hidden">Tanya</span>
        </a>
      </div>
    </header>
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);
