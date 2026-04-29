import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import CampaignList from "./pages/CampaignList.tsx";
import CampaignDetail from "./pages/CampaignDetail.tsx";
import Donate from "./pages/Donate.tsx";
import Admin from "./pages/Admin.tsx";
import AdminCampaigns from "./pages/AdminCampaigns.tsx";
import AdminCampaignAnalytics from "./pages/AdminCampaignAnalytics.tsx";
import AdminDonations from "./pages/AdminDonations.tsx";
import AdminHeroes from "./pages/AdminHeroes.tsx";
import AdminQris from "./pages/AdminQris.tsx";
import AdminPayments from "./pages/AdminPayments.tsx";
import AdminStorage from "./pages/AdminStorage.tsx";
import AdminSettings from "./pages/AdminSettings.tsx";
import FacebookPixel from "./components/FacebookPixel.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {/* Facebook Pixel — dimuat di semua halaman, inject script dari DB */}
        <FacebookPixel />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/campaign" element={<CampaignList />} />
          <Route path="/campaign/:id" element={<CampaignDetail />} />
          <Route path="/donasi/:id" element={<Donate />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/campaigns" element={<AdminCampaigns />} />
          <Route path="/admin/campaigns/:id/analytics" element={<AdminCampaignAnalytics />} />
          <Route path="/admin/donations" element={<AdminDonations />} />
          <Route path="/admin/heroes" element={<AdminHeroes />} />
          <Route path="/admin/qris" element={<AdminQris />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
          <Route path="/admin/storage" element={<AdminStorage />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
