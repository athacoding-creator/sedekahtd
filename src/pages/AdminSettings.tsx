import { AdminLayout } from "@/components/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, ExternalLink, CheckCircle2, AlertTriangle, Eye, EyeOff, RefreshCw } from "lucide-react";

type Setting = {
  key: string;
  value: string;
};

const AdminSettings = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pixelId, setPixelId] = useState("");
  const [pixelEnabled, setPixelEnabled] = useState(false);
  const [showPixelId, setShowPixelId] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "ok" | "fail">("idle");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value");
    setLoading(false);
    if (error) { toast.error(error.message); return; }

    const map: Record<string, string> = {};
    (data as Setting[]).forEach(s => { map[s.key] = s.value ?? ""; });
    setSettings(map);
    setPixelId(map["fb_pixel_id"] ?? "");
    setPixelEnabled(map["fb_pixel_enabled"] === "true");
  };

  useEffect(() => { load(); }, []);

  const upsert = async (key: string, value: string) => {
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) throw error;
  };

  const save = async () => {
    if (pixelEnabled && !pixelId.trim()) {
      toast.error("Masukkan Pixel ID terlebih dahulu sebelum mengaktifkan.");
      return;
    }
    if (pixelId.trim() && !/^\d{10,20}$/.test(pixelId.trim())) {
      toast.error("Pixel ID tidak valid. Pixel ID Facebook berupa angka 10–20 digit.");
      return;
    }

    setSaving(true);
    try {
      await upsert("fb_pixel_id", pixelId.trim());
      await upsert("fb_pixel_enabled", pixelEnabled ? "true" : "false");
      toast.success("Pengaturan disimpan. Pixel akan aktif setelah halaman di-refresh.");
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const testPixel = async () => {
    if (!pixelId.trim()) { toast.error("Masukkan Pixel ID dulu"); return; }
    setTestStatus("testing");
    // Cek apakah fbq sudah ter-load di window
    await new Promise(r => setTimeout(r, 1000));
    if (typeof window.fbq === "function") {
      window.fbq("track", "PageView");
      setTestStatus("ok");
      toast.success("Pixel aktif dan berhasil mengirim event PageView!");
    } else {
      setTestStatus("fail");
      toast.error("Pixel belum aktif. Pastikan Pixel ID benar, aktifkan, simpan, lalu refresh halaman.");
    }
    setTimeout(() => setTestStatus("idle"), 4000);
  };

  return (
    <AdminLayout
      title="Pengaturan Website"
      subtitle="Kelola integrasi dan konfigurasi website"
      back={{ to: "/admin", label: "Kembali ke Dashboard" }}
    >
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">

          {/* Facebook Pixel Card */}
          <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/30">
              <div className="h-10 w-10 rounded-xl bg-[#1877F2]/10 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-[#1877F2]">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <div>
                <h2 className="font-display font-bold text-base">Facebook Pixel</h2>
                <p className="text-xs text-muted-foreground">Lacak pengunjung dan konversi donasi</p>
              </div>
              <div className="ml-auto">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  pixelEnabled && settings["fb_pixel_id"]
                    ? "bg-green-100 text-green-700"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {pixelEnabled && settings["fb_pixel_id"] ? (
                    <><CheckCircle2 className="h-3 w-3" /> Aktif</>
                  ) : "Nonaktif"}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Info box */}
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-700 space-y-1">
                <p className="font-semibold">Cara mendapatkan Pixel ID:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Buka <a href="https://business.facebook.com/events_manager" target="_blank" rel="noopener noreferrer" className="underline font-semibold inline-flex items-center gap-0.5">Meta Events Manager <ExternalLink className="h-3 w-3" /></a></li>
                  <li>Pilih atau buat Pixel baru</li>
                  <li>Salin Pixel ID (berupa angka, contoh: 1234567890123)</li>
                  <li>Tempel di kolom di bawah, aktifkan, lalu klik Simpan</li>
                </ol>
              </div>

              {/* Pixel ID Input */}
              <div>
                <label className="block text-sm font-bold mb-2">Pixel ID</label>
                <div className="relative">
                  <input
                    type={showPixelId ? "text" : "password"}
                    value={pixelId}
                    onChange={e => setPixelId(e.target.value.replace(/\D/g, ""))}
                    placeholder="Contoh: 1234567890123"
                    maxLength={20}
                    className="w-full pr-10 pl-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none font-mono text-sm transition-smooth"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPixelId(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPixelId ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Hanya angka, 10–20 digit</p>
              </div>

              {/* Toggle aktif */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-background">
                <div>
                  <div className="font-semibold text-sm">Aktifkan Pixel</div>
                  <div className="text-xs text-muted-foreground">Script Pixel akan dimuat di semua halaman website</div>
                </div>
                <button
                  type="button"
                  onClick={() => setPixelEnabled(s => !s)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                    pixelEnabled ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                    pixelEnabled ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
              </div>

              {/* Warning jika enabled tapi ID kosong */}
              {pixelEnabled && !pixelId.trim() && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-orange-50 border border-orange-200 text-sm text-orange-700">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  Masukkan Pixel ID untuk mengaktifkan tracking.
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-button hover:scale-[1.02] transition-smooth disabled:opacity-60 disabled:hover:scale-100"
                >
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</> : <><Save className="h-4 w-4" /> Simpan Pengaturan</>}
                </button>
                <button
                  onClick={testPixel}
                  disabled={testStatus === "testing" || !pixelId.trim()}
                  className={`px-4 py-3 rounded-xl font-semibold text-sm border transition-smooth disabled:opacity-50 inline-flex items-center gap-2 ${
                    testStatus === "ok"
                      ? "bg-green-50 border-green-300 text-green-700"
                      : testStatus === "fail"
                      ? "bg-red-50 border-red-300 text-red-700"
                      : "bg-secondary border-border hover:bg-secondary/80"
                  }`}
                  title="Test apakah Pixel sudah aktif di halaman ini"
                >
                  {testStatus === "testing" ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Testing...</>
                  ) : testStatus === "ok" ? (
                    <><CheckCircle2 className="h-4 w-4" /> Aktif!</>
                  ) : testStatus === "fail" ? (
                    <><AlertTriangle className="h-4 w-4" /> Belum aktif</>
                  ) : (
                    <><RefreshCw className="h-4 w-4" /> Test Pixel</>
                  )}
                </button>
              </div>

              {/* Status saat ini */}
              {settings["fb_pixel_id"] && (
                <div className="p-3 rounded-xl bg-muted/50 border border-border text-xs text-muted-foreground">
                  <span className="font-semibold">Pixel aktif saat ini:</span>{" "}
                  <code className="bg-background px-2 py-0.5 rounded font-mono">
                    {settings["fb_pixel_enabled"] === "true" ? settings["fb_pixel_id"] : "—"}
                  </code>
                  {settings["fb_pixel_enabled"] !== "true" && " (dinonaktifkan)"}
                </div>
              )}
            </div>
          </div>

          {/* Placeholder untuk pengaturan lain di masa depan */}
          <div className="bg-card rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground text-sm">
            <p className="font-semibold mb-1">Pengaturan lainnya</p>
            <p className="text-xs">Google Analytics, WhatsApp API, dan integrasi lainnya akan tersedia di sini.</p>
          </div>

        </div>
      )}
    </AdminLayout>
  );
};

export default AdminSettings;
