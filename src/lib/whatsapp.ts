export const WA_NUMBER = "6285111514040";

export const DEFAULT_TEMPLATE_CONFIRM =
  "Assalamu'alaikum Admin Teras Dakwah,\n\nSaya {panggilan} {nama} sudah melakukan transfer donasi:\n• Nominal: Rp {nominal}\n• Campaign: {campaign}\n\nBerikut saya kirim bukti transfernya. Mohon konfirmasinya, jazakumullah khairan.";

export const DEFAULT_TEMPLATE_THANKYOU =
  "Halo {panggilan} {nama}, terima kasih atas donasi sebesar Rp {nominal} untuk {campaign}. Jazakallahu khairan 🙏";

export const buildFromTemplate = (
  template: string,
  vars: Record<string, string>,
): string => {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.split(`{${key}}`).join(value);
  }
  // Cleanup double spaces (in case panggilan kosong)
  result = result.replace(/  +/g, " ");
  return result;
};

/** Pisahkan panggilan (Bapak/Ibu/Kak) dari nama lengkap yg tersimpan. */
export const splitPanggilan = (full: string): { panggilan: string; nama: string } => {
  const match = full.match(/^(Bapak|Ibu|Kak)\s+(.+)$/i);
  if (match) return { panggilan: match[1], nama: match[2] };
  return { panggilan: "", nama: full };
};

export const buildWaConfirmUrl = (params: {
  nama: string;
  nominal: number;
  campaign?: string;
  template?: string;
  panggilan?: string;
}) => {
  const nominalStr = new Intl.NumberFormat("id-ID").format(params.nominal);
  const text = buildFromTemplate(params.template || DEFAULT_TEMPLATE_CONFIRM, {
    panggilan: params.panggilan ?? "",
    nama: params.nama,
    nominal: nominalStr,
    campaign: params.campaign ?? "-",
  });
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
};
