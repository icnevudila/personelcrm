import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { requireProjectAccess } from "@/lib/projectCopy/context";
import { synthesizeProjectPrompt } from "@/lib/copyfast/claude";
import { buildProjectPrompt } from "@/lib/copyfast/prompts";

export async function POST(request, { params }) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const allowed = await requireProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const { data: project } = await supabase
    .from("projects")
    .select("name")
    .eq("id", projectId)
    .single();

  const { data: items } = await supabase
    .from("copyfast_items")
    .select("*")
    .eq("project_id", projectId)
    .eq("status", "generated")
    .order("sort_order", { ascending: true });

  const analyzed = (items || []).filter((i) => i.generated_prompt?.trim());
  if (analyzed.length === 0) {
    return NextResponse.json(
      { error: "Proje analizi için en az bir analiz edilmiş sayfa/bileşen gerekli" },
      { status: 400 }
    );
  }

  await supabase
    .from("copyfast_meta")
    .upsert({
      project_id: projectId,
      project_prompt_status: "generating",
      project_prompt_error: null,
      updated_at: new Date().toISOString(),
    });

  try {
    let projectPrompt;

    if (process.env.CLAUDE_API_KEY) {
      projectPrompt = await synthesizeProjectPrompt({
        projectName: project?.name || "Proje",
        pagePrompts: analyzed,
      });
    } else {
      projectPrompt = buildProjectPrompt({
        projectName: project?.name,
        items: analyzed,
      });
    }

    const { data: meta, error } = await supabase
      .from("copyfast_meta")
      .upsert({
        project_id: projectId,
        project_prompt: projectPrompt,
        project_prompt_status: "generated",
        project_prompt_error: null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json(meta);
  } catch (err) {
    const errorMessage = err.message || "Proje analizi hatası";
    const { data: meta } = await supabase
      .from("copyfast_meta")
      .upsert({
        project_id: projectId,
        project_prompt_status: "error",
        project_prompt_error: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    return NextResponse.json({ error: errorMessage, meta }, { status: 500 });
  }
}
