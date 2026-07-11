import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { redirect } from "next/navigation";
import CrmDashboard from "@/components/crm/CrmDashboard";

export const metadata = { title: "Müşteri CRM — Site CRM" };

export default async function CrmPage() {
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);

  if (!user) redirect("/login");
  if (!admin) redirect("/dashboard");

  return <CrmDashboard />;
}
