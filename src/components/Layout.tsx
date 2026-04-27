import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { Footer } from "./Footer";
import logoTerasDakwah from "@/assets/logo-teras-dakwah.png";

export const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-muted/40 flex justify-center">
    <div className="w-full max-w-[480px] min-h-screen flex flex-col bg-background shadow-xl relative">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/90 border-b border-border/60">
        <div className="px-4 flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center group">
            <img
              src={logoTerasDakwah}
              alt="Teras Dakwah"
              className="h-9 w-auto group-hover:scale-105 transition-smooth"
            />
          </Link>
          <a
            href="https://wa.me/6281234567890"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-blue hover:bg-primary-dark transition-smooth flex items-center gap-1.5"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Tanya Program</span>
          </a>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  </div>
);
