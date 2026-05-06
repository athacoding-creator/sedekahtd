export const WA_NUMBER = "6285111514040";

export const DEFAULT_TEMPLATE_CONFIRM =
  "Assalamu'alaikum Admin Teras Dakwah,\n\nSaya sudah melakukan transfer donasi:\n• Nama: {nama}\n• Nominal: Rp {nominal}\n• Campaign: {campaign}\n\nBerikut saya kirim bukti transfernya. Mohon konfirmasinya, jazakumullah khairan.";

export const DEFAULT_TEMPLATE_THANKYOU =
  "Halo {nama}, terima kasih atas donasi sebesar Rp {nominal} untuk {campaign}. Jazakallahu khairan 🙏";

export const buildFromTemplate = (
  template: string,
  vars: Record<string, string>,
): string => {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{${key}}`, value);
  }
  return result;
};

export const buildWaConfirmUrl = (params: {
  nama: string;
  nominal: number;
  campaign?: string;
  template?: string;
}) => {
  const nominalStr = new Intl.NumberFormat("id-ID").format(params.nominal);
  const text = buildFromTemplate(params.template || DEFAULT_TEMPLATE_CONFIRM, {
    nama: params.nama,
    nominal: nominalStr,
    campaign: params.campaign ?? "-",
  });
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
};
