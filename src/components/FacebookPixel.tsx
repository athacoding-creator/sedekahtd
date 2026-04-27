import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Extend Window type for fbq
declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

let pixelInitialized = false;
let cachedPixelId: string | null = null;

const initPixel = (pixelId: string) => {
  if (!pixelId || pixelInitialized) return;
  pixelInitialized = true;

  // Inject Facebook Pixel base code
  const script = document.createElement("script");
  script.innerHTML = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${pixelId}');
    fbq('track', 'PageView');
  `;
  document.head.appendChild(script);

  // Inject noscript fallback
  const noscript = document.createElement("noscript");
  noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"/>`;
  document.head.appendChild(noscript);
};

const FacebookPixel = () => {
  const location = useLocation();

  useEffect(() => {
    const loadAndInit = async () => {
      // Ambil pixel ID dari database (cache setelah pertama kali)
      if (cachedPixelId === null) {
        const { data } = await supabase
          .from("site_settings")
          .select("key, value")
          .in("key", ["fb_pixel_id", "fb_pixel_enabled"]);

        const settings: Record<string, string> = {};
        (data ?? []).forEach((row: { key: string; value: string }) => {
          settings[row.key] = row.value;
        });

        const enabled = settings["fb_pixel_enabled"] === "true";
        const pixelId = settings["fb_pixel_id"]?.trim() ?? "";

        cachedPixelId = enabled && pixelId ? pixelId : "";
      }

      if (cachedPixelId) {
        initPixel(cachedPixelId);
      }
    };

    loadAndInit();
  }, []);

  // Track PageView on every route change
  useEffect(() => {
    if (typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
  }, [location.pathname]);

  return null;
};

// Helper: track custom events dari halaman lain
export const trackFbEvent = (event: string, params?: Record<string, any>) => {
  if (typeof window.fbq === "function") {
    window.fbq("track", event, params);
  }
};

export default FacebookPixel;
