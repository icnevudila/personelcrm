import DeepWorkShell from "@/components/deep-work/DeepWorkShell";

export const metadata = { title: "Deep Work — Was CRM" };

export default function DeepWorkPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Deep Work</h1>
        <p className="text-sm text-zinc-500">Günlük 2 saat odak çalışma sistemi</p>
      </div>
      <DeepWorkShell />
    </div>
  );
}
