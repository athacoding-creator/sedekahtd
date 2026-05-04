import { Link } from "react-router-dom";
import { formatRupiah } from "@/lib/format";
import { CheckCircle2 } from "lucide-react";

export type Campaign = {
  id: string;
  judul: string;
  deskripsi: string;
  gambar_url: string | null;
  target: number;
  terkumpul: number;
  kategori: string | null;
  is_pilihan?: boolean;
};

/** Card style Teras Dakwah: gambar atas, info bawah, progress hijau */
export const CampaignCard = ({ c, index = 0 }: { c: Campaign; index?: number }) => {
  const isUnlimited = c.target === 0;
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((c.terkumpul / Math.max(1, c.target)) * 100));
  return (
    <Link
      to={`/campaign/${c.id}`}
      className="group block bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-card border border-slate-100/80 transition-smooth hover:-translate-y-0.5 animate-fade-in-up"
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: "backwards" }}
    >
      <div className="flex flex-col">
        <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
          <img
            src={c.gambar_url ?? "/placeholder.svg"}
            alt={c.judul}
            loading="lazy"
            className="h-full w-full object-cover group-hover:scale-105 transition-smooth duration-500"
          />
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
        </div>
        <div className="p-4 flex flex-col justify-between min-w-0">
          <div>
            <h3 className="font-display font-bold text-sm sm:text-base leading-snug mb-2 line-clamp-2 text-slate-800 group-hover:text-primary transition-smooth">
              {c.judul}
            </h3>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-3">
              <span className="truncate">YAYASAN TERAS DAKWAH</span>
              <CheckCircle2 className="h-3 w-3 text-primary flex-shrink-0 fill-primary text-white" />
            </div>
            <div className="text-sm font-bold text-primary mb-2.5">
              {formatRupiah(c.terkumpul)} <span className="text-[10px] font-normal text-slate-400">terkumpul</span>
            </div>
          </div>
          <div className="space-y-1.5">
            {!isUnlimited && (
              <>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400 font-medium">{pct}% tercapai</span>
                  <span className="text-slate-400">dari {formatRupiah(c.target).replace("Rp ", "Rp")}</span>
                </div>
              </>
            )}
            {isUnlimited && (
              <div className="text-[10px] text-slate-400 font-medium">Target: Tak Terbatas</div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
