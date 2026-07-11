"use client";

import { useMemo, useState } from "react";
import { filterProjects } from "@/lib/projectMeta";
import ProjectMetaFilters from "@/components/project/ProjectMetaFilters";
import ProjectList from "@/components/ProjectList";

export default function DashboardProjects({ initialProjects, isAdmin }) {
  const [statusFilter, setStatusFilter] = useState(null);
  const [typeFilter, setTypeFilter] = useState(null);

  const filteredProjects = useMemo(
    () => filterProjects(initialProjects, { status: statusFilter, type: typeFilter }),
    [initialProjects, statusFilter, typeFilter]
  );

  return (
    <div className="space-y-3">
      <ProjectMetaFilters
        variant="inline"
        statusFilter={statusFilter}
        typeFilter={typeFilter}
        onStatusChange={setStatusFilter}
        onTypeChange={setTypeFilter}
      />
      <ProjectList
        key={`${statusFilter ?? "all"}-${typeFilter ?? "all"}`}
        initialProjects={filteredProjects}
        isAdmin={isAdmin}
        emptyMessage={
          initialProjects.length > 0 ? "Seçilen filtrelere uygun proje yok." : undefined
        }
      />
    </div>
  );
}
