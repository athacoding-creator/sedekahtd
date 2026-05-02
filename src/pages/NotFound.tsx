import { Layout } from "@/components/Layout";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Layout>
      <div className="container py-20 text-center max-w-md mx-auto">
        <div className="text-7xl font-display font-extrabold text-primary mb-4">404</div>
        <h1 className="font-display text-2xl font-bold mb-2">Halaman Tidak Ditemukan</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold shadow-button hover:scale-[1.02] transition-smooth"
        >
          <Home className="h-4 w-4" /> Kembali ke Beranda
        </Link>
      </div>
    </Layout>
  );
};

export default NotFound;
