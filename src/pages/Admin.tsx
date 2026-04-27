import { Layout } from "@/components/Layout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatRupiah } from "@/lib/format";
import { CheckCircle2, Eye, LogOut, Loader2 } from "lucide-react";

type Donation = {
  id: string;
  nama: string;
  nominal: number;
  metode_pembayaran: string;
  bukti_transfer: string | null;
  status: string;
  created_at: string;
  campaign_id: string | null;
};

const Admin = () => {
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [donations, setDonations] = useState<Donation[]>([]);
  const [authLoading, setAuthLoading] = useState(false);

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

  const loadDonations = () => {
    supabase.from("donations").select("*").order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        else setDonations((data as Donation[]) ?? []);
      });
  };

  useEffect(() => { if (isAdmin) loadDonations(); }, [isAdmin]);

  const login = async () => {
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setAuthLoading(false);
    if (error) toast.error(error.message);
  };

  const signup = async () => {
    setAuthLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/admin` }
    });
    setAuthLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Akun dibuat. Minta admin existing untuk memberi role admin via Supabase.");
  };

  const verify = async (id: string) => {
    const { error } = await supabase.from("donations").update({ status: "verified" }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Donasi diverifikasi"); loadDonations(); }
  };

  const viewBukti = async (path: string) => {
    const { data, error } = await supabase.storage.from("bukti-transfer").createSignedUrl(path, 60);
    if (error) toast.error(error.message);
    else window.open(data.signedUrl, "_blank");
  };

  if (!session) {
    return (
      <Layout>
        <div className="container py-16 max-w-md">
          <h1 className="font-display text-3xl font-extrabold mb-2">Admin Login</h1>
          <p className="text-muted-foreground mb-6 text-sm">Masuk untuk mengelola donasi.</p>
          <div className="bg-card border border-border/60 rounded-3xl shadow-soft p-6 space-y-4">
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none" />
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none" />
            <div className="flex gap-2">
              <button onClick={login} disabled={authLoading} className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-button disabled:opacity-60">
                {authLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Masuk"}
              </button>
              <button onClick={signup} disabled={authLoading} className="px-4 py-3 rounded-xl bg-secondary font-semibold hover:bg-secondary/80">Daftar</button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (isAdmin === null) return <Layout><div className="container py-20 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div></Layout>;

  if (!isAdmin) {
    return (
      <Layout>
        <div className="container py-16 max-w-md text-center">
          <h1 className="font-display text-2xl font-extrabold mb-2">Akses Ditolak</h1>
          <p className="text-muted-foreground mb-6 text-sm">Akun ini bukan admin. Hubungi admin untuk diberi role.</p>
          <p className="text-xs text-muted-foreground mb-6">User ID: <code className="bg-secondary px-2 py-1 rounded">{session.user.id}</code></p>
          <button onClick={() => supabase.auth.signOut()} className="px-5 py-2 rounded-full bg-secondary font-semibold">Keluar</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-extrabold">Admin Panel</h1>
            <p className="text-muted-foreground text-sm">{donations.length} donasi total</p>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-sm font-semibold hover:bg-secondary/80">
            <LogOut className="h-4 w-4" /> Keluar
          </button>
        </div>

        <div className="bg-card rounded-3xl border border-border/60 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tanggal</th>
                  <th className="px-4 py-3 font-semibold">Nama</th>
                  <th className="px-4 py-3 font-semibold">Nominal</th>
                  <th className="px-4 py-3 font-semibold">Metode</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {donations.map(d => (
                  <tr key={d.id} className="border-t border-border/60 hover:bg-secondary/30 transition-smooth">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(d.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    <td className="px-4 py-3 font-semibold">{d.nama}</td>
                    <td className="px-4 py-3 font-bold text-primary">{formatRupiah(d.nominal)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.metode_pembayaran}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        d.status === "verified" ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"
                      }`}>
                        {d.status === "verified" ? "Berhasil" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {d.bukti_transfer && (
                          <button onClick={() => viewBukti(d.bukti_transfer!)} className="p-2 rounded-lg hover:bg-secondary transition-smooth" title="Lihat bukti">
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        {d.status !== "verified" && (
                          <button onClick={() => verify(d.id)} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1 shadow-button">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Verifikasi
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {donations.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">Belum ada donasi.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Admin;
