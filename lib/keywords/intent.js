const RULES = [
  { intent: "Emergency", patterns: [/acil/i, /7\s*\/\s*24/i, /7\s*24/i, /gece/i] },
  { intent: "Commercial", patterns: [/fiyat/i, /ücret/i, /ucret/i, /ne kadar/i, /tarife/i] },
  { intent: "Transactional", patterns: [/randevu/i, /sipariş/i, /siparis/i, /iletişim/i, /iletisim/i] },
  {
    intent: "Informational",
    patterns: [/nasıl/i, /nasil/i, /nedir/i, /ne yapmalı/i, /ne yapmalıyım/i, /\?$/],
  },
  { intent: "Navigational", patterns: [/en yakın/i, /en yakin/i, /yakınımda/i, /yakinimda/i] },
];

export function detectSearchIntent(keyword, { city, district } = {}) {
  const k = (keyword || "").toLowerCase();
  for (const { intent, patterns } of RULES) {
    if (patterns.some((p) => p.test(k))) return intent;
  }
  if (district && k.includes(district.toLowerCase())) return "Local";
  if (city && k.includes(city.toLowerCase())) return "Local";
  const cities = ["bursa", "ankara", "izmir", "istanbul", "antalya", "adana"];
  if (cities.some((c) => k.includes(c))) return "Local";
  return "Informational";
}
