import RoadmapShell from "@/components/roadmap/RoadmapShell";

export const metadata = { title: "RoadMap — Was CRM" };

export default function RoadmapPage() {
  return (
    <div
      className="fixed inset-x-0 bottom-0 top-[var(--dashboard-header-height)] bg-zinc-50 dark:bg-zinc-950"
      aria-label="RoadMap"
    >
      <RoadmapShell />
    </div>
  );
}
