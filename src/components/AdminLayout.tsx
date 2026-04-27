import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, LogOut, Home } from "lucide-react";
import logoTerasDakwah from "@/assets/logo-teras-dakwah.png";

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  back?: { to: string; label: string };
};

export const AdminLayout = ({ title, subtitle, children, back }: Props) => {
  const nav = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  if (!session || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    nav("/admin");
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b border-border sticky top-0 z-40">
        <div className="container max-w-6xl flex items-center justify-between h-16 px-4">
          <Link to="/admin" className="flex items-center gap-3">
            <img src={logoTerasDakwah} alt="Teras Dakwah" className="h-9 w-auto" />
            <span className="font-display font-bold text-lg hidden sm:inline">{"\n"}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary text-xs font-semibold hover:bg-secondary/80 transition-smooth">
              <Home className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Lihat Website</span>
            </Link>
            <button
              onClick={() => supabase.auth.signOut().then(() => nav("/admin"))}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold hover:opacity-90 transition-smooth"
            >
              <LogOut className="h-3.5 w-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl px-4 py-8">
        {back && (
          <Link to={back.to} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-smooth mb-4">
            ← {back.label}
          </Link>
        )}
        <div className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-extrabold">{title}</h1>
          {subtitle && <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>}
        </div>
        {children}
      </main>
    </div>
  );
};
