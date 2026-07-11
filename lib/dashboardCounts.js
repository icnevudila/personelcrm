/**
 * Dashboard özet sayıları (admin: tümü; kullanıcı: kendi projeleri).
 */
export async function getDashboardCounts(supabase, userId, isAdmin) {
  let pendingUpdates = 0;
  let pendingInstallations = 0;
  let paymentPending = 0;

  if (isAdmin) {
    const { count: u } = await supabase
      .from("update_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");
    pendingUpdates = u ?? 0;

    const { count: i } = await supabase
      .from("installation_forms")
      .select("*", { count: "exact", head: true })
      .eq("is_completed", false);
    pendingInstallations = i ?? 0;

    const { count: p } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("payment_status", "pending");
    paymentPending = p ?? 0;
  } else {
    if (!userId) {
      return { pendingUpdates: 0, pendingInstallations: 0, paymentPending: 0 };
    }
    const { data: proj } = await supabase.from("projects").select("id").eq("user_id", userId);
    const ids = (proj || []).map((row) => row.id);
    if (ids.length > 0) {
      const { count: u } = await supabase
        .from("update_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")
        .in("project_id", ids);
      pendingUpdates = u ?? 0;

      const { count: i } = await supabase
        .from("installation_forms")
        .select("*", { count: "exact", head: true })
        .eq("is_completed", false)
        .in("project_id", ids);
      pendingInstallations = i ?? 0;

      const { count: p } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("payment_status", "pending")
        .eq("user_id", userId);
      paymentPending = p ?? 0;
    }
  }

  return { pendingUpdates, pendingInstallations, paymentPending };
}
