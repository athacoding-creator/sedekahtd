import { Layout } from "@/components/Layout";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Campaign } from "@/components/CampaignCard";
import { formatRupiah } from "@/lib/format";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Upload, Copy, ArrowLeft, QrCode, Package, Minus, Plus, Landmark, Wallet, CreditCard, Phone } from "lucide-react";
import { z } from "zod";
import qrisPlaceholder from "@/assets/qris-placeholder.png";
import { buildWaConfirmUrl } from "@/lib/whatsapp";
import { loadFbPixel, fbTrack } from "@/lib/tracking";

type PaymentMethod = {
  id: string;
  nama: string;
  tipe: "qris" | "bank_transfer" | "gopay" | "shopeepay" | "dana" | "ovo" | "lainnya";
  nomor_rekening: string | null;
  nama_pemilik: string | null;
  gambar_url: string | null;
  deskripsi: string | null;
  aktif: boolean;
};

type CampaignWithPayments = Campaign & {
  fb_pixel_id?: string | null;
  jenis_campaign: string;
  nama_paket: string | null;
  harga_paket: number | null;
};

const isQrisType = (t: PaymentMethod["tipe"]) => t === "qris";
const tipeLabel = (t: PaymentMethod["tipe"]) =>
  ({ qris: "QRIS", bank_transfer: "Transfer Bank", gopay: "GoPay", shopeepay: "ShopeePay", dana: "DANA", ovo: "OVO", lainnya: "Lainnya" }[t]);
const tipeIcon = (t: PaymentMethod["tipe"]) => isQrisType(t) ? QrCode : t === "bank_transfer" ? Landmark : ["gopay","shopeepay","dana","ovo"].includes(t) ? Wallet : CreditCard;

const schema = z.object({
  nama: z.string().trim().min(2, "Nama minimal 2 karakter").max(80),
  nominal: z.number().int().positive("Nominal harus lebih dari 0").max(1_000_000_000),
  no_whatsapp: z.string().trim().min(9, "No. WhatsApp minimal 9 digit").max(15, "No. WhatsApp maksimal 15 digit").regex(/^[0-9]+$/, "No. WhatsApp hanya boleh berisi angka"),
});

const nominalQuick = [25000, 50000, 100000, 250000, 500000, 1000000];

const Donate = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const [campaign, setCampaign] = useState<CampaignWithPayments | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPm, setSelectedPm] = useState<PaymentMethod | null>(null);
  const [step, setStep] = useState<"form" | "pay">("form");
  const [nama, setNama] = useState("");
  const [noWa, setNoWa] = useState("");
  const [nominal, setNominal] = useState<string>("");
  const [jumlahPaket, setJumlahPaket] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: c } = await (supabase as any).from("campaigns").select("*").eq("id", id).maybeSingle();
      if (!c) return;
      setCampaign(c as CampaignWithPayments);
      if ((c as any).fb_pixel_id) loadFbPixel((c as any).fb_pixel_id);
      if (c.jenis_campaign === "paket" && c.harga_paket) setNominal(String(c.harga_paket));

      // Load payment methods linked to this campaign
      const { data: links } = await (supabase as any)
        .from("campaign_payment_methods")
        .select("payment_method_id")
        .eq("campaign_id", id);
      const ids = (links ?? []).map((l: any) => l.payment_method_id);
      if (ids.length > 0) {
        const { data: pms } = await (supabase as any)
          .from("payment_methods")
          .select("*")
          .in("id", ids)
          .eq("aktif", true)
          .order("urutan");
        const list = (pms as PaymentMethod[]) ?? [];
        setPaymentMethods(list);
        if (list.length > 0) setSelectedPm(list[0]);
      }
    })();
  }, [id]);

  const isPaket = campaign?.jenis_campaign === "paket";
  const hargaPaket = campaign?.harga_paket ?? 0;
  const nominalPaket = isPaket ? jumlahPaket * hargaPaket : 0;
  const nominalFinal = isPaket ? nominalPaket : Number(nominal);

  const buildMetodeLabel = (pm: PaymentMethod | null) => {
    if (!pm) return "QRIS";
    const base = `${tipeLabel(pm.tipe)} - ${pm.nama}`;
    if (pm.nomor_rekening) return `${base} (${pm.nomor_rekening}${pm.nama_pemilik ? ` a.n. ${pm.nama_pemilik}` : ""})`;
    return base;
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast.error("Ukuran file maksimal 5MB"); return; }
    setFile(f);
  };

  const goPay = () => {
    const parse = schema.safeParse({ nama, nominal: nominalFinal, no_whatsapp: noWa });
    if (!parse.success) { toast.error(parse.error.issues[0].message); return; }
    setStep("pay");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const copyNominal = async () => {
    await navigator.clipboard.writeText(String(nominalFinal));
    toast.success("Nominal disalin");
  };

  const submit = async () => {
    if (!file) { toast.error("Silakan upload bukti transfer"); return; }
    const parse = schema.safeParse({ nama, nominal: nominalFinal, no_whatsapp: noWa });
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
        no_whatsapp: parse.data.no_whatsapp,
        metode_pembayaran: buildMetodeLabel(selectedPm),
        bukti_transfer: path,
        status: "pending",
      });
      if (insErr) throw insErr;

      const waUrl = buildWaConfirmUrl({
        nama: parse.data.nama,
        nominal: parse.data.nominal,
        campaign: campaign?.judul,
      });
      window.open(waUrl, "_blank");

      fbTrack("Purchase", {
        value: parse.data.nominal,
        currency: "IDR",
        content_name: campaign?.judul,
      });

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
            {isPaket && (
              <div className="inline-flex items-center gap-2 mt-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                <Package className="h-4 w-4" />
                {jumlahPaket} paket {campaign?.nama_paket}
              </div>
            )}
          </div>

          <div className="bg-card rounded-3xl border border-border/60 shadow-soft p-6 space-y-5">

            {/* Detail Pembayaran */}
            {selectedPm ? (
              isQrisType(selectedPm.tipe) ? (
                <div className="bg-white rounded-2xl p-4 border border-border/60 text-center">
                  {selectedPm.gambar_url ? (
                    <img src={selectedPm.gambar_url} alt={selectedPm.nama} className="w-full max-w-xs mx-auto" />
                  ) : (
                    <img src={qrisPlaceholder} alt={selectedPm.nama} className="w-full max-w-xs mx-auto" />
                  )}
                  <p className="text-sm font-semibold mt-2 text-foreground">{selectedPm.nama}</p>
                  {selectedPm.deskripsi && <p className="text-xs text-muted-foreground mt-1">{selectedPm.deskripsi}</p>}
                  <div className="flex items-center justify-center gap-2 mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
                    <QrCode className="h-4 w-4 flex-shrink-0" />
                    Scan QR di atas dengan aplikasi e-wallet/m-banking Anda.
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-border bg-background p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    {selectedPm.gambar_url && (
                      <img src={selectedPm.gambar_url} alt={selectedPm.nama} className="h-12 w-12 object-contain rounded-lg border border-border bg-white p-1" />
                    )}
                    <div>
                      <div className="text-xs text-muted-foreground uppercase font-bold">{tipeLabel(selectedPm.tipe)}</div>
                      <div className="font-display font-bold">{selectedPm.nama}</div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-muted/40 border border-border p-4 text-center">
                    <div className="text-[10px] uppercase text-muted-foreground font-bold tracking-wide mb-1">
                      {selectedPm.tipe === "bank_transfer" ? "Nomor Rekening" : "Nomor Tujuan"}
                    </div>
                    <div className="font-mono font-extrabold text-2xl text-foreground tracking-wider mb-2">
                      {selectedPm.nomor_rekening}
                    </div>
                    {selectedPm.nama_pemilik && (
                      <div className="text-xs text-muted-foreground mb-3">a.n. <span className="font-semibold text-foreground">{selectedPm.nama_pemilik}</span></div>
                    )}
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(selectedPm.nomor_rekening ?? "");
                        toast.success("Nomor disalin");
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-button hover:scale-[1.02] transition-smooth"
                    >
                      <Copy className="h-3.5 w-3.5" /> Salin Nomor
                    </button>
                  </div>
                  {selectedPm.deskripsi && <p className="text-xs text-muted-foreground">{selectedPm.deskripsi}</p>}
                </div>
              )
            ) : (
              <div className="bg-white rounded-2xl p-4 border border-border/60 text-center">
                <img src={qrisPlaceholder} alt="QRIS" className="w-full max-w-xs mx-auto" width={512} height={640} />
                <p className="text-sm font-semibold mt-2 text-foreground">QRIS — Yayasan Teras Dakwah</p>
              </div>
            )}

            {/* Nominal */}
            <div className="rounded-2xl border border-border bg-background p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  {isPaket ? `${jumlahPaket} paket × ${formatRupiah(hargaPaket)}` : "Nominal donasi"}
                </div>
                <div className="font-display font-extrabold text-2xl text-accent">{formatRupiah(nominalFinal)}</div>
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

          {/* No. WhatsApp */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              No. WhatsApp <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span className="text-sm font-semibold">+62</span>
              </div>
              <input
                type="tel"
                value={noWa}
                onChange={e => setNoWa(e.target.value.replace(/\D/g, ""))}
                maxLength={15}
                placeholder="8xxxxxxxxxx"
                className="w-full pl-20 pr-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none transition-smooth"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Digunakan admin untuk konfirmasi donasi Anda</p>
          </div>

          {/* ===== JENIS PAKET ===== */}
          {isPaket ? (
            <div>
              <label className="block text-sm font-semibold mb-3">Jumlah Paket</label>
              {/* Info paket */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 mb-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-sm">{campaign?.nama_paket ?? "Paket Donasi"}</p>
                  <p className="text-xs text-muted-foreground">{formatRupiah(hargaPaket)} per paket</p>
                </div>
              </div>

              {/* Counter paket */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-background border border-border">
                <button
                  type="button"
                  onClick={() => setJumlahPaket(p => Math.max(1, p - 1))}
                  className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-smooth disabled:opacity-40"
                  disabled={jumlahPaket <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <div className="text-center">
                  <div className="font-display font-extrabold text-3xl">{jumlahPaket}</div>
                  <div className="text-xs text-muted-foreground">paket</div>
                </div>
                <button
                  type="button"
                  onClick={() => setJumlahPaket(p => p + 1)}
                  className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-smooth"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Total */}
              <div className="mt-3 p-4 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground">Total donasi</span>
                <span className="font-display font-extrabold text-xl text-accent">{formatRupiah(nominalPaket)}</span>
              </div>
            </div>
          ) : (
            /* ===== JENIS UANG ===== */
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
          )}

          {/* Metode pembayaran */}
          {paymentMethods.length > 0 ? (
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Metode Pembayaran</div>
              <div className="space-y-2">
                {paymentMethods.map(pm => {
                  const Icon = tipeIcon(pm.tipe);
                  const active = selectedPm?.id === pm.id;
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setSelectedPm(pm)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-smooth text-left ${
                        active ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40"
                      }`}
                    >
                      {pm.gambar_url ? (
                        <img src={pm.gambar_url} alt="" className="h-10 w-10 object-contain rounded-lg border border-border bg-white p-0.5" />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{pm.nama}</div>
                        <div className="text-xs text-muted-foreground">
                          {tipeLabel(pm.tipe)}
                          {pm.nomor_rekening && ` · ${pm.nomor_rekening}`}
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${active ? "border-primary bg-primary" : "border-border"}`}>
                        {active && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-background p-4">
              <div className="text-xs text-muted-foreground mb-1">Metode Pembayaran</div>
              <div className="font-semibold">QRIS — Yayasan Teras Dakwah</div>
            </div>
          )}

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
