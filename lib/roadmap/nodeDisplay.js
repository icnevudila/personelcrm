/** Uzun başlıklar için kutu genişliğine göre punto */
export function getTitleFontSize(title, nodeWidth) {
  const len = String(title || "").length;
  const w = nodeWidth || 200;
  if (len > 50 || (len > 35 && w < 200)) return 9;
  if (len > 38 || (len > 28 && w < 180)) return 10;
  if (len > 28 || (len > 20 && w < 160)) return 11;
  if (len > 18) return 12;
  return 14;
}

export function getDescriptionFontSize(description) {
  const len = String(description || "").length;
  if (len > 120) return 9;
  if (len > 80) return 10;
  if (len > 50) return 11;
  return 11;
}
