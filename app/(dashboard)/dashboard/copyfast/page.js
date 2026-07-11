import { redirect } from "next/navigation";

export const metadata = { title: "CopyFast — Site CRM" };

export default function CopyFastPage() {
  redirect("/dashboard");
}
