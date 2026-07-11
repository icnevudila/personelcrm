import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { redirect } from "next/navigation";
import GroupDetail from "@/components/crm/GroupDetail";

export const metadata = { title: "Grup Detayı — Müşteri CRM" };

export default async function GroupPage({ params }) {
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);

  if (!user) redirect("/login");
  if (!admin) redirect("/dashboard");

  const { groupId } = await params;

  return <GroupDetail groupId={groupId} />;
}
