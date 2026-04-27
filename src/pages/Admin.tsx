import { Layout } from "@/components/Layout";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowLeft, Megaphone, HandHeart, LogOut, Home } from "lucide-react";
import logoTerasDakwah from "@/public/favicon.png";

const Admin = () => {
  const nav = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [stats, setStats] = useState({ campaigns: 0, donations: 0, pending: 0 });

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

  useEffect(() => {
    if (!isAdmin) return;
    Promise.all([
      supabase.from("campaigns").select("id", { count: "exact", head: true }),
      supabase.from("donations").select("id", { count: "exact", head: true }),
      supabase.from("donations").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]).then(([c, d, p]) => {
      setStats({ campaigns: c.count ?? 0, donations: d.count ?? 0, pending: p.count ?? 0 });
    });
  }, [isAdmin]);

  const login = async () => {
    if (!email || !password) { toast.error("Email & password wajib diisi"); return; }
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setAuthLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Berhasil masuk");
  };

  // ============ LOGIN PAGE ============
  if (!session) {
    return (
      <Layout>
        <div className="px-6 pt-6 pb-12">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-smooth">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Beranda
          </Link>

          <div className="text-center mt-12 mb-8">
            <img src={logoTerasDakwah} alt="Teras Dakwah" className="h-20 w-auto mx-auto mb-6" />
            <h1 className="font-display text-3xl font-extrabold mb-2">Login Admin</h1>
            <p className="text-muted-foreground text-sm">Masuk untuk mengelola konten website</p>
          </div>

          <div className="bg-card border border-border/60 rounded-2xl shadow-soft p-6 space-y-5">
            <div>
              <label className="block text-sm font-bold mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  type="email"
                  placeholder="admin@terasdakwah.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none transition-smooth"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && login()}
                  type={showPwd ? "text" : "password"}
                  placeholder="Masukkan password"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none transition-smooth"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              onClick={login}
              disabled={authLoading}
              className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-button hover:scale-[1.02] transition-smooth disabled:opacity-60 disabled:hover:scale-100"
            >
              {authLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Masuk"}
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8">
            © {new Date().getFullYear()} Teras Dakwah. All Rights Reserved.
          </p>
        </div>
      </Layout>
    );
  }

  if (isAdmin === null) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="px-6 py-16 text-center">
          <h1 className="font-display text-2xl font-extrabold mb-2">Akses Ditolak</h1>
          <p className="text-muted-foreground mb-6 text-sm">Akun ini bukan admin.</p>
          <p className="text-xs text-muted-foreground mb-6">User ID: <code className="bg-secondary px-2 py-1 rounded">{session.user.id}</code></p>
          <button onClick={() => supabase.auth.signOut()} className="px-5 py-2 rounded-full bg-secondary font-semibold">Keluar</button>
        </div>
      </Layout>
    );
  }

  // ============ DASHBOARD ============
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b border-border sticky top-0 z-40">
        <div className="container max-w-6xl flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <img src={logoTerasDakwah} alt="Teras Dakwah" className="h-9 w-auto" />
            <span className="font-display font-bold text-lg">{"\n"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary text-xs font-semibold hover:bg-secondary/80 transition-smooth">
              <Home className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Lihat Website</span>
            </Link>
            <button
              onClick={() => supabase.auth.signOut()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold hover:opacity-90 transition-smooth"
            >
              <LogOut className="h-3.5 w-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl px-4 py-8">
        {/* Hero greeting */}
        <div className="rounded-2xl bg-gradient-to-r from-primary to-primary-dark text-primary-foreground p-6 md:p-8 mb-8 shadow-blue">
          <h1 className="font-display text-2xl md:text-3xl font-extrabold mb-2">Selamat Datang, Admin! 👋</h1>
          <p className="text-primary-foreground/90 text-sm">Kelola konten website Yayasan Teras Dakwah Indonesia dari sini</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <StatCard label="Total Campaign" value={stats.campaigns} />
          <StatCard label="Total Donasi" value={stats.donations} />
          <StatCard label="Donasi Pending" value={stats.pending} highlight />
        </div>

        {/* Menu */}
        <h2 className="font-display text-lg font-bold mb-4">Menu Pengelolaan</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MenuCard
            to="/admin/campaigns"
            icon={<Megaphone className="h-6 w-6 text-primary" />}
            title="Campaign"
            desc="Kelola campaign donasi: tambah, edit, hapus"
          />
          <MenuCard
            to="/admin/donations"
            icon={<HandHeart className="h-6 w-6 text-primary" />}
            title="Donasi"
            desc="Lihat & verifikasi donasi yang masuk"
          />
        </div>
      </main>
    </div>
  );
};

const StatCard = ({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) => (
  <div className={`rounded-2xl border p-5 bg-card ${highlight ? "border-warning/40" : "border-border"}`}>
    <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">{label}</div>
    <div className={`font-display font-extrabold text-3xl mt-1 ${highlight ? "text-warning" : "text-foreground"}`}>{value}</div>
  </div>
);

const MenuCard = ({ to, icon, title, desc }: { to: string; icon: React.ReactNode; title: string; desc: string }) => (
  <Link
    to={to}
    className="group rounded-2xl bg-card border border-border p-6 hover:border-primary hover:shadow-soft transition-smooth"
  >
    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-smooth">
      {icon}
    </div>
    <div className="font-display font-bold text-lg mb-1">{title}</div>
    <div className="text-sm text-muted-foreground">{desc}</div>
  </Link>
);

export default Admin;
