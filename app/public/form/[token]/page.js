import PublicInstallationForm from "@/components/public/PublicInstallationForm";

export const metadata = { title: "Kurulum Formu" };

export default async function PublicFormPage({ params }) {
  const { token } = await params;
  return <PublicInstallationForm token={token} />;
}
