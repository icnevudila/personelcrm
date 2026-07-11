"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DomainTab from "@/components/project/DomainTab";
import PagesTab from "@/components/project/PagesTab";
import InstallationTab from "@/components/project/InstallationTab";
import UpdatesTab from "@/components/project/UpdatesTab";
import PromptTab from "@/components/project/PromptTab";
import SettingsTab from "@/components/project/SettingsTab";
import DbSchemaPlannerTab from "@/components/project/DbSchemaPlannerTab";
import KeywordExplorerTab from "@/components/project/KeywordExplorerTab";
import LogoTab from "@/components/project/LogoTab";
import CopyFastTab from "@/components/project/CopyFastTab";
import AiTitleGeneratorTab from "@/components/project/AiTitleGeneratorTab";
import ProjectOverviewTab from "@/components/project/ProjectOverviewTab";
import TodoListTab from "@/components/project/TodoListTab";
import MvpFeaturesTab from "@/components/project/MvpFeaturesTab";
import MarketingBlueprintTab from "@/components/project/MarketingBlueprintTab";
import ProductBlueprintTab from "@/components/project/ProductBlueprintTab";
import NameFinderTab from "@/components/project/NameFinderTab";
import SlogansTab from "@/components/project/SlogansTab";
import ProjectMetaFilters from "@/components/project/ProjectMetaFilters";
import ProjectNavSidebar, {
  getTabsForProjectType,
  DEFAULT_PROJECT_TAB,
} from "@/components/project/ProjectNavSidebar";
import RoadmapShell from "@/components/roadmap/RoadmapShell";

export default function ProjectDetail({ project, isAdmin, currentUserId }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const projectType = project.type || "landing_page";
  const tabs = useMemo(() => getTabsForProjectType(projectType), [projectType]);
  const validTabKeys = useMemo(() => tabs.map((t) => t.key), [tabs]);
  const activeTab = validTabKeys.includes(tabParam) ? tabParam : DEFAULT_PROJECT_TAB;

  function setActiveTab(key) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", key);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  const publicToken = project.installation_forms?.[0]?.public_token;
  const isSchemaPlanner = activeTab === "db-schema-planner";
  const isRoadmap = activeTab === "roadmap";

  useEffect(() => {
    if (!isSchemaPlanner && !isRoadmap) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSchemaPlanner, isRoadmap]);

  useEffect(() => {
    if (tabParam && !validTabKeys.includes(tabParam)) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", DEFAULT_PROJECT_TAB);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, [tabParam, validTabKeys, searchParams, router]);

  if (isRoadmap) {
    return (
      <div className="fixed inset-0 z-[200] bg-white dark:bg-zinc-950">
        <RoadmapShell
          projectId={project.id}
          projectName={project.name}
          onBack={() => setActiveTab(DEFAULT_PROJECT_TAB)}
        />
      </div>
    );
  }

  if (isSchemaPlanner) {
    return (
      <div className="fixed inset-0 z-[200] bg-white dark:bg-zinc-950">
        <DbSchemaPlannerTab
          projectId={project.id}
          projectName={project.name}
          projectDescription={project.description}
          fullscreen
          onBack={() => setActiveTab(DEFAULT_PROJECT_TAB)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-zinc-900 dark:text-zinc-50">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-zinc-500 line-clamp-2">{project.description}</p>
          )}
        </div>
      </div>

      <div className="flex gap-3 sm:gap-5">
        <ProjectNavSidebar
          activeTab={activeTab}
          onNavigate={setActiveTab}
          projectType={projectType}
        />

        <main className="min-w-0 flex-1 pb-24">
          {activeTab === "overview" && (
            <ProjectOverviewTab project={project} onNavigate={setActiveTab} />
          )}
          {activeTab === "blueprint" && (
            <ProductBlueprintTab projectId={project.id} />
          )}
          {activeTab === "name-finder" && (
            <NameFinderTab projectId={project.id} />
          )}
          {activeTab === "slogans" && (
            <SlogansTab projectId={project.id} />
          )}
          {activeTab === "todo-list" && <TodoListTab projectId={project.id} />}
          {activeTab === "mvp-features" && <MvpFeaturesTab projectId={project.id} />}
          {activeTab === "installation" && (
            <InstallationTab
              projectId={project.id}
              publicToken={publicToken}
              isAdmin={isAdmin}
            />
          )}
          {activeTab === "updates" && (
            <UpdatesTab
              projectId={project.id}
              projectName={project.name}
              isAdmin={isAdmin}
              publicToken={project.update_public_token}
            />
          )}
          {activeTab === "domain" && (
            <DomainTab projectId={project.id} initialDomains={project.domains || []} />
          )}
          {activeTab === "pages" && <PagesTab sitePages={project.site_pages || []} />}
          {activeTab === "marketing" && (
            <MarketingBlueprintTab projectId={project.id} />
          )}
          {activeTab === "keyword-explorer" && (
            <KeywordExplorerTab projectId={project.id} />
          )}
          {activeTab === "logo" && (
            <LogoTab
              projectId={project.id}
              projectName={project.name}
              projectDescription={project.description}
            />
          )}
          {activeTab === "copyfast" && (
            <CopyFastTab projectId={project.id} projectName={project.name} />
          )}
          {activeTab === "ai-title-generator" && (
            <AiTitleGeneratorTab projectId={project.id} projectName={project.name} />
          )}
          {activeTab === "blog" && (
            <div className="rounded-xl border border-zinc-200 p-8 text-center dark:border-zinc-700">
              <p className="text-sm text-zinc-500">Blog özelliği yakında eklenecek.</p>
            </div>
          )}
          {activeTab === "messages" && (
            <div className="rounded-xl border border-zinc-200 p-8 text-center dark:border-zinc-700">
              <p className="text-sm text-zinc-500">Mesajlar özelliği yakında eklenecek.</p>
            </div>
          )}
          {activeTab === "prompt" && (
            <PromptTab projectId={project.id} initialSetupPrompt={project.setup_prompt} />
          )}
          {activeTab === "settings" && (
            <SettingsTab
              projectId={project.id}
              initialProjectName={project.name}
              initialProjectDescription={project.description}
              initialIsArchived={project.is_archived}
              initialPaymentStatus={project.payment_status}
              initialProjectType={project.type || "landing_page"}
            />
          )}
        </main>
      </div>
    </div>
  );
}
