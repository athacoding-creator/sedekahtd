import { supabase } from "@/integrations/supabase/client";

const VISITOR_KEY = "td_visitor_id";

export const getVisitorId = () => {
  let v = localStorage.getItem(VISITOR_KEY);
  if (!v) {
    v = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)) as string;
    localStorage.setItem(VISITOR_KEY, v);
  }
  return v;
};

export const trackCampaignVisit = async (campaignId: string) => {
  const flag = `td_visit_${campaignId}`;
  if (sessionStorage.getItem(flag)) return;
  sessionStorage.setItem(flag, "1");
  try {
    await supabase.from("campaign_visits").insert({
      campaign_id: campaignId,
      visitor_id: getVisitorId(),
      user_agent: navigator.userAgent,
      referrer: document.referrer || null,
    });
  } catch {
    /* silent */
  }
};

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

let currentPixelId: string | null = null;

export const loadFbPixel = (pixelId: string) => {
  if (!pixelId || currentPixelId === pixelId) return;
  // basic FB pixel snippet
  if (!window.fbq) {
    /* eslint-disable */
    (function (f: any, b, e, v, n?: any, t?: any, s?: any) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    /* eslint-enable */
  }
  window.fbq("init", pixelId);
  window.fbq("track", "PageView");
  currentPixelId = pixelId;
};

export const fbTrack = (event: string, params?: Record<string, any>) => {
  if (window.fbq) window.fbq("track", event, params || {});
};
