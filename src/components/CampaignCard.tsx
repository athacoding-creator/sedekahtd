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
};

/** Card style Teras Dakwah: gambar kiri, info kanan, progress hijau */
export const CampaignCard = ({ c, index = 0 }: { c: Campaign; index?: number }) => {
  const pct = Math.min(100, Math.round((c.terkumpul / Math.max(1, c.target)) * 100));
  return (
    <Link
      to={`/campaign/${c.id}`}
      className="group block bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-card border border-border/60 transition-smooth hover:-translate-y-0.5 animate-fade-in-up"
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: "backwards" }}
    >
      <div className="grid grid-cols-[40%_1fr] sm:grid-cols-[35%_1fr]">
        <div className="relative aspect-square sm:aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={c.gambar_url ?? "/placeholder.svg"}
            alt={c.judul}
            loading="lazy"
            className="h-full w-full object-cover group-hover:scale-105 transition-smooth duration-500"
          />
        </div>
        <div className="p-4 sm:p-5 flex flex-col justify-between min-w-0">
          <div>
            <h3 className="font-display font-bold text-sm sm:text-base leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-smooth">
              {c.judul}
            </h3>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-3">
              <span className="truncate">YAYASAN TERAS DAKWAH</span>
              <CheckCircle2 className="h-3 w-3 text-primary flex-shrink-0 fill-primary text-primary-foreground" />
            </div>
            <div className="text-sm font-bold text-primary mb-2">
              {formatRupiah(c.terkumpul)} <span className="text-[10px] font-normal text-muted-foreground">terkumpul</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-progress rounded-full transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-muted-foreground">{pct}% tercapai</span>
              <span className="text-muted-foreground">dari {formatRupiah(c.target).replace("Rp ", "Rp")}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
