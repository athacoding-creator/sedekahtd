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
import AdminDonations from "./pages/AdminDonations.tsx";
import AdminHeroes from "./pages/AdminHeroes.tsx";
import AdminQris from "./pages/AdminQris.tsx";
import AdminStorage from "./pages/AdminStorage.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/campaign" element={<CampaignList />} />
          <Route path="/campaign/:id" element={<CampaignDetail />} />
          <Route path="/donasi/:id" element={<Donate />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/campaigns" element={<AdminCampaigns />} />
          <Route path="/admin/donations" element={<AdminDonations />} />
          <Route path="/admin/heroes" element={<AdminHeroes />} />
          <Route path="/admin/qris" element={<AdminQris />} />
          <Route path="/admin/storage" element={<AdminStorage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
