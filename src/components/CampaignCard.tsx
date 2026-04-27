import { Link } from "react-router-dom";
import { formatRupiahShort } from "@/lib/format";
import { Users } from "lucide-react";

export type Campaign = {
  id: string;
  judul: string;
  deskripsi: string;
  gambar_url: string | null;
  target: number;
  terkumpul: number;
  kategori: string | null;
};

export const CampaignCard = ({ c, index = 0 }: { c: Campaign; index?: number }) => {
  const pct = Math.min(100, Math.round((c.terkumpul / Math.max(1, c.target)) * 100));
  return (
    <Link
      to={`/campaign/${c.id}`}
      className="group block bg-card rounded-3xl overflow-hidden shadow-soft hover:shadow-card border border-border/60 transition-smooth hover:-translate-y-1 animate-fade-in-up"
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: "backwards" }}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <img
          src={c.gambar_url ?? "/placeholder.svg"}
          alt={c.judul}
          loading="lazy"
          className="h-full w-full object-cover group-hover:scale-110 transition-smooth duration-500"
        />
        {c.kategori && (
          <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-background/90 backdrop-blur text-xs font-semibold text-primary">
            {c.kategori}
          </span>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-display font-bold text-base leading-snug mb-3 line-clamp-2 group-hover:text-primary transition-smooth">
          {c.judul}
        </h3>
        <div className="space-y-2">
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full gradient-hero rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Terkumpul</span>
            <span className="font-bold text-primary">{pct}%</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border/60">
            <div>
              <div className="text-sm font-bold">{formatRupiahShort(c.terkumpul)}</div>
              <div className="text-[10px] text-muted-foreground">dari {formatRupiahShort(c.target)}</div>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" /> Donatur
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
