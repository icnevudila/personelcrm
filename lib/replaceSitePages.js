import { normalizePageTitles } from "@/lib/sitePages";

/**
 * Projenin site_pages satırlarını tamamen yeniler (sil + sırayla insert).
 */
export async function replaceSitePages(supabase, projectId, titles) {
  const list = normalizePageTitles(titles);
  const { error: delErr } = await supabase.from("site_pages").delete().eq("project_id", projectId);
  if (delErr) throw delErr;
  if (list.length === 0) return;
  const rows = list.map((title, i) => ({
    project_id: projectId,
    title,
    sort_order: i,
  }));
  const { error } = await supabase.from("site_pages").insert(rows);
  if (error) throw error;
}
