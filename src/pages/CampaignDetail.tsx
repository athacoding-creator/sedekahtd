import { Layout } from "@/components/Layout";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Campaign } from "@/components/CampaignCard";
import { formatRupiah } from "@/lib/format";
import { ArrowLeft, Calendar, Heart, Share2, Target } from "lucide-react";
import { trackCampaignVisit, loadFbPixel, fbTrack } from "@/lib/tracking";

const CampaignDetail = () => {
  const { id } = useParams();
  const [c, setC] = useState<(Campaign & { fb_pixel_id?: string | null }) | null>(null);

  useEffect(() => {
    if (!id) return;
    (supabase as any).from("campaigns").select("*").eq("id", id).maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setC(data as any);
        trackCampaignVisit(id);
        const pixel = (data as any).fb_pixel_id;
        if (pixel) loadFbPixel(pixel);
      });

    // Real-time: update terkumpul & progress bar saat donasi diverifikasi
    const channel = supabase
      .channel(`campaign-detail-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "campaigns", filter: `id=eq.${id}` }, (payload) => {
        setC(prev => prev ? { ...prev, terkumpul: (payload.new as any).terkumpul } : prev);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  if (!c) return <Layout><div className="container py-20 text-center text-muted-foreground">Memuat...</div></Layout>;

  const isUnlimited = c.target === 0;
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((c.terkumpul / Math.max(1, c.target)) * 100));

  return (
    <Layout>
      <div className="container py-6">
        <Link to="/campaign" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-smooth">
          <ArrowLeft className="h-4 w-4" /> Kembali ke campaign
        </Link>
      </div>
      <div className="container pb-16 space-y-6">
        <div className="animate-fade-in-up">
          <div className="rounded-3xl overflow-hidden shadow-card aspect-[16/10] bg-muted">
            <img src={c.gambar_url ?? "/placeholder.svg"} alt={c.judul} className="h-full w-full object-cover" />
          </div>
          {c.kategori && (
            <span className="inline-block mt-5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              {c.kategori}
            </span>
          )}
          <h1 className="font-display text-2xl font-extrabold mt-3 mb-4 leading-tight">{c.judul}</h1>
          <div className="prose prose-sm max-w-none">
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{c.deskripsi}</p>
          </div>
        </div>

        <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: "100ms", animationFillMode: "backwards" }}>
          <div className="bg-card rounded-3xl border border-border/60 shadow-soft p-6">
            <div className="mb-5">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Terkumpul</div>
                  <div className="font-display font-extrabold text-2xl text-primary">{formatRupiah(c.terkumpul)}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary">{pct}%</div>
                </div>
              </div>
              {!isUnlimited && (
                <div className="h-3 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-progress rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Target className="h-3 w-3" /> Target: {isUnlimited ? "Tak Terbatas" : formatRupiah(c.target)}
              </div>
            </div>

            <Link
              to={`/donasi/${c.id}`}
              onClick={() => fbTrack("InitiateCheckout", { content_name: c.judul })}
              className="w-full text-center px-6 py-4 rounded-2xl font-extrabold shadow-button hover:scale-[1.02] transition-smooth flex items-center justify-center gap-2 uppercase tracking-wide text-sm"
              style={c.tombol_warna ? { backgroundColor: c.tombol_warna, color: "#fff" } : undefined}
            >
              {!c.tombol_warna && <span className="absolute inset-0 -z-10 rounded-2xl bg-accent" />}
              <Heart className="h-4 w-4 fill-current" /> {c.tombol_teks?.trim() || "Sedekah Sekarang"}
            </Link>

            <button
              onClick={async () => {
                const url = window.location.href;
                const shareData = {
                  title: c.judul,
                  text: `Yuk bantu campaign: ${c.judul}`,
                  url,
                };
                try {
                  if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
                    await navigator.share(shareData);
                    return;
                  }
                } catch (err: any) {
                  if (err?.name === "AbortError") return;
                }
                try {
                  await navigator.clipboard.writeText(url);
                  const { toast } = await import("sonner");
                  toast.success("Link campaign disalin ke clipboard");
                } catch {
                  const { toast } = await import("sonner");
                  toast.error("Gagal membagikan");
                }
              }}
              className="mt-3 w-full px-6 py-3 rounded-2xl bg-secondary text-foreground font-semibold hover:bg-secondary/80 transition-smooth flex items-center justify-center gap-2"
            >
              <Share2 className="h-4 w-4" /> Bagikan
            </button>
          </div>

          <div className="bg-card rounded-3xl border border-border/60 shadow-soft p-6 text-sm space-y-3">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              <span>Penggalangan aktif</span>
            </div>
            <p className="text-xs text-muted-foreground border-t border-border/60 pt-3">
              Donasi Anda 100% disalurkan ke penerima manfaat. Laporan pertanggungjawaban tersedia untuk donatur.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CampaignDetail;
