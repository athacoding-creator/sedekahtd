import { Layout } from "@/components/Layout";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Campaign } from "@/components/CampaignCard";
import { formatRupiah } from "@/lib/format";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Upload, Copy, ArrowLeft, QrCode } from "lucide-react";
import { z } from "zod";
import qrisPlaceholder from "@/assets/qris-placeholder.png";
import { buildWaConfirmUrl } from "@/lib/whatsapp";

type QrisData = {
  id: string;
  nama: string;
  gambar_url: string;
  deskripsi: string | null;
};

type CampaignWithQris = Campaign & {
  qris_id: string | null;
  qris_list: QrisData | null;
};

const schema = z.object({
  nama: z.string().trim().min(2, "Nama minimal 2 karakter").max(80),
  nominal: z.number().int().positive("Nominal harus lebih dari 0").max(1_000_000_000),
});

const nominalQuick = [25000, 50000, 100000, 250000, 500000, 1000000];

const Donate = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const [campaign, setCampaign] = useState<CampaignWithQris | null>(null);
  const [step, setStep] = useState<"form" | "pay">("form");
  const [nama, setNama] = useState("");
  const [nominal, setNominal] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("campaigns")
      .select("*, qris_list(id, nama, gambar_url, deskripsi)")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => setCampaign(data as CampaignWithQris));
  }, [id]);

  const qris = campaign?.qris_list ?? null;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast.error("Ukuran file maksimal 5MB"); return; }
    setFile(f);
  };

  const goPay = () => {
    const parse = schema.safeParse({ nama, nominal: Number(nominal) });
    if (!parse.success) { toast.error(parse.error.issues[0].message); return; }
    setStep("pay");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const copyNominal = async () => {
    await navigator.clipboard.writeText(String(nominal));
    toast.success("Nominal disalin");
  };

  const submit = async () => {
    if (!file) { toast.error("Silakan upload bukti transfer"); return; }
    const parse = schema.safeParse({ nama, nominal: Number(nominal) });
    if (!parse.success) { toast.error(parse.error.issues[0].message); return; }

    setLoading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("bukti-transfer").upload(path, file);
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("donations").insert({
        campaign_id: id,
        nama: parse.data.nama,
        nominal: parse.data.nominal,
        metode_pembayaran: qris ? `QRIS - ${qris.nama}` : "QRIS",
        bukti_transfer: path,
        status: "pending",
      });
      if (insErr) throw insErr;

      // Buka WhatsApp untuk konfirmasi ke admin
      const waUrl = buildWaConfirmUrl({
        nama: parse.data.nama,
        nominal: parse.data.nominal,
        campaign: campaign?.judul,
      });
      window.open(waUrl, "_blank");

      setDone(true);
    } catch (e: any) {
      toast.error(e.message || "Gagal mengirim donasi");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <Layout>
        <div className="container py-20 max-w-md mx-auto text-center animate-scale-in">
          <div className="h-20 w-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-extrabold mb-3">Terima kasih!</h1>
          <p className="text-muted-foreground mb-2">Donasi Anda telah kami terima.</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning/10 text-warning border border-warning/20 text-sm font-semibold mb-8">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Menunggu verifikasi admin
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => nav("/campaign")} className="px-6 py-3 rounded-full bg-secondary font-semibold hover:bg-secondary/80 transition-smooth">
              Campaign lain
            </button>
            <button onClick={() => nav("/")} className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold shadow-button">
              Ke beranda
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // STEP: Pembayaran QRIS
  if (step === "pay") {
    return (
      <Layout>
        <div className="container py-6 max-w-2xl">
          <button onClick={() => setStep("form")} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-smooth mb-4">
            <ArrowLeft className="h-4 w-4" /> Ubah data donasi
          </button>

          <div className="text-center mb-6">
            <p className="text-sm text-muted-foreground">Terima kasih <span className="font-semibold text-foreground">{nama}</span></p>
            <p className="text-sm text-muted-foreground">atas donasi yang akan Anda berikan untuk:</p>
            {campaign && <p className="font-display font-bold text-lg mt-2">{campaign.judul}</p>}
          </div>

          <div className="bg-card rounded-3xl border border-border/60 shadow-soft p-6 space-y-5">
            {/* QR Code */}
            <div className="bg-white rounded-2xl p-4 border border-border/60">
              {qris ? (
                <div className="text-center">
                  <img
                    src={qris.gambar_url}
                    alt={qris.nama}
                    className="w-full max-w-xs mx-auto"
                  />
                  <p className="text-sm font-semibold mt-2 text-foreground">{qris.nama}</p>
                  {qris.deskripsi && (
                    <p className="text-xs text-muted-foreground mt-1">{qris.deskripsi}</p>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <img
                    src={qrisPlaceholder}
                    alt="QRIS Yayasan Teras Dakwah"
                    className="w-full max-w-xs mx-auto"
                    width={512}
                    height={640}
                  />
                  <p className="text-sm font-semibold mt-2 text-foreground">QRIS — Yayasan Teras Dakwah</p>
                </div>
              )}
            </div>

            {!qris && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
                <QrCode className="h-4 w-4 flex-shrink-0" />
                Scan QR-Code di atas untuk mentransfer dengan aplikasi e-wallet/m-banking favorit Anda.
              </div>
            )}

            {qris && (
              <p className="text-center text-xs text-muted-foreground">
                Scan QR-Code di atas untuk mentransfer dengan aplikasi e-wallet/m-banking favorit Anda.
              </p>
            )}

            {/* Nominal */}
            <div className="rounded-2xl border border-border bg-background p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Nominal donasi</div>
                <div className="font-display font-extrabold text-2xl text-accent">{formatRupiah(Number(nominal))}</div>
              </div>
              <button onClick={copyNominal} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-secondary text-xs font-semibold hover:bg-secondary/80 transition-smooth">
                <Copy className="h-3.5 w-3.5" /> Salin
              </button>
            </div>

            {/* Upload bukti */}
            <div>
              <label className="block text-sm font-semibold mb-2">Konfirmasi Pembayaran</label>
              <label className={`flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-smooth ${
                file ? "border-primary bg-primary/5" : "border-border hover:border-primary hover:bg-secondary/40"
              }`}>
                <input type="file" accept="image/*,application/pdf" onChange={handleFile} className="hidden" />
                {file ? (
                  <>
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                    <span className="text-sm font-semibold text-primary">{file.name}</span>
                    <span className="text-xs text-muted-foreground">Klik untuk ganti</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm font-semibold">Upload bukti transfer</span>
                    <span className="text-xs text-muted-foreground">PNG, JPG, atau PDF — maks 5MB</span>
                  </>
                )}
              </label>
            </div>

            <button
              onClick={submit}
              disabled={loading || !file}
              className="w-full px-6 py-4 rounded-2xl bg-primary text-primary-foreground font-extrabold uppercase tracking-wide text-sm shadow-button hover:scale-[1.02] transition-smooth flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Mengirim...</>) : "Konfirmasi Pembayaran"}
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // STEP: Form
  return (
    <Layout>
      <div className="container py-10 max-w-2xl">
        <h1 className="font-display text-3xl font-extrabold mb-2">Form Donasi</h1>
        {campaign && <p className="text-muted-foreground mb-8">Untuk: <span className="font-semibold text-foreground">{campaign.judul}</span></p>}

        <div className="bg-card rounded-3xl border border-border/60 shadow-soft p-6 space-y-6">
          {/* Nama */}
          <div>
            <label className="block text-sm font-semibold mb-2">Nama Donatur</label>
            <input
              value={nama}
              onChange={e => setNama(e.target.value)}
              maxLength={80}
              placeholder="Nama lengkap (atau Hamba Allah)"
              className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none transition-smooth"
            />
          </div>

          {/* Nominal */}
          <div>
            <label className="block text-sm font-semibold mb-2">Nominal Donasi</label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {nominalQuick.map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNominal(String(n))}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-smooth ${
                    nominal === String(n) ? "bg-primary text-primary-foreground border-primary shadow-button" : "bg-background border-border hover:border-primary"
                  }`}
                >
                  {formatRupiah(n).replace("Rp ", "")}
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">Rp</span>
              <input
                type="number"
                value={nominal}
                onChange={e => setNominal(e.target.value)}
                placeholder="Nominal lain"
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none transition-smooth"
              />
            </div>
          </div>

          {/* Metode pembayaran */}
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="text-xs text-muted-foreground mb-1">Metode Pembayaran</div>
            {qris ? (
              <div className="flex items-center gap-3">
                <img
                  src={qris.gambar_url}
                  alt={qris.nama}
                  className="h-10 w-10 object-contain rounded-lg border border-border bg-white p-0.5"
                />
                <div>
                  <div className="font-semibold text-sm">{qris.nama}</div>
                  {qris.deskripsi && <div className="text-xs text-muted-foreground">{qris.deskripsi}</div>}
                </div>
              </div>
            ) : (
              <div className="font-semibold">QRIS — Yayasan Teras Dakwah</div>
            )}
          </div>

          <button
            onClick={goPay}
            className="w-full px-6 py-4 rounded-2xl bg-accent text-accent-foreground font-extrabold uppercase tracking-wide text-sm shadow-button hover:scale-[1.02] transition-smooth"
          >
            Lanjut ke Pembayaran
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Donate;
