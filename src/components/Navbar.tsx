import { Link, NavLink, useLocation } from "react-router-dom";
import { Heart, Menu, X, MessageCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Home" },
  { to: "/campaign", label: "Campaign" },
  { to: "/tentang", label: "Tentang" },
  { to: "/kontak", label: "Kontak" },
];

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  return (
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

        <nav className="hidden md:flex items-center gap-1">
          {items.map(i => (
            <NavLink
              key={i.to}
              to={i.to}
              className={({ isActive }) => cn(
                "px-4 py-2 text-sm font-medium rounded-full transition-smooth",
                isActive ? "bg-secondary text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              )}
            >
              {i.label}
            </NavLink>
          ))}
          <a href="https://wa.me/6281234567890" target="_blank" rel="noreferrer"
             className="ml-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-blue hover:bg-primary-dark transition-smooth flex items-center gap-2">
            <MessageCircle className="h-4 w-4" /> Tanya Program
          </a>
        </nav>

        <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg hover:bg-secondary transition-smooth">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border/60 bg-background animate-fade-in">
          <div className="container py-3 flex flex-col gap-1">
            {items.map(i => (
              <Link
                key={i.to}
                to={i.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "px-4 py-3 rounded-xl text-sm font-medium transition-smooth",
                  loc.pathname === i.to ? "bg-secondary text-primary" : "hover:bg-secondary/60"
                )}
              >
                {i.label}
              </Link>
            ))}
            <a href="https://wa.me/6281234567890" target="_blank" rel="noreferrer"
               className="mt-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold text-center shadow-blue flex items-center justify-center gap-2">
              <MessageCircle className="h-4 w-4" /> Tanya Program
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
