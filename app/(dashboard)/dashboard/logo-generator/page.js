import { redirect } from "next/navigation";

export const metadata = { title: "Logo generator — Site CRM" };

export default function LogoGeneratorPage() {
  redirect("/dashboard");
}
