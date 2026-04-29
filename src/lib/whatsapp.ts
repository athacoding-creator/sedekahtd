export const WA_NUMBER = "6285111514040";

export const buildWaConfirmUrl = (params: {
  nama: string;
  nominal: number;
  campaign?: string;
}) => {
  const lines = [
    "Assalamu'alaikum Admin Teras Dakwah,",
    "",
    "Saya sudah melakukan transfer donasi:",
    `• Nama: ${params.nama}`,
    `• Nominal: Rp ${new Intl.NumberFormat("id-ID").format(params.nominal)}`,
  ];
  if (params.campaign) lines.push(`• Campaign: ${params.campaign}`);
  lines.push("", "Berikut saya kirim bukti transfernya. Mohon konfirmasinya, jazakumullah khairan.");
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
};
