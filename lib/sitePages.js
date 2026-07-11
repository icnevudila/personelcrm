/**
 * site_pages satırlarından sıralı başlık listesi (kurulum / prompt için).
 */
export function titlesFromSitePages(sitePages) {
  if (!Array.isArray(sitePages) || sitePages.length === 0) return [];
  return [...sitePages]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((row) => (typeof row.title === "string" ? row.title.trim() : ""))
    .filter(Boolean);
}

/**
 * Kayıt öncesi: boşları at, yinelenen başlıkları (ilk sırayı koruyarak) tekilleştir.
 */
export function normalizePageTitles(titles) {
  if (!Array.isArray(titles)) return [];
  const seen = new Set();
  const out = [];
  const MUST_HAVE = "Ana Sayfa";
  for (const t of titles) {
    const s = String(t).trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  if (!seen.has(MUST_HAVE)) {
    out.unshift(MUST_HAVE);
  }
  return out;
}

/**
 * installation_forms yanıtından pages jsonb alanını çıkarır (artık kullanılmıyor).
 */
export function omitInstallationPages(formRow) {
  if (!formRow || typeof formRow !== "object") return formRow;
  const { pages: _removed, ...rest } = formRow;
  return rest;
}
