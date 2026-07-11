import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { redirect } from "next/navigation";
import Link from "next/link";
import DashboardBackLink from "@/components/dashboard/DashboardBackLink";

export const metadata = { title: "Ödeme bekleyen projeler — Site CRM" };

export default async function PaymentPendingPage() {
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) redirect("/login");

  let query = supabase
    .from("projects")
    .select("id, name, created_at, payment_status")
    .eq("payment_status", "pending")
    .order("created_at", { ascending: false });

  if (!admin) {
    query = query.eq("user_id", user.id);
  }

  const { data: rows, error } = await query;

  if (error) {
    return (
      <div>
        <DashboardBackLink />
        <p className="text-sm text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <DashboardBackLink />
      <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Ödeme beklenen</h1>
      <p className="mt-1 text-sm text-zinc-500">Ödemesi henüz tamamlanmamış projeler</p>

      {!rows?.length ? (
        <p className="mt-8 text-center text-sm text-zinc-500">Kayıt yok.</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <Link
                href={`/projects/${row.id}`}
                className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
              >
                {row.name}
              </Link>
              <p className="text-xs text-zinc-500">
                {row.created_at ? new Date(row.created_at).toLocaleDateString("tr-TR") : "—"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
