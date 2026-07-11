import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { requireProjectAccess } from "@/lib/projectCopy/context";
import { analyzeWithClaude } from "@/lib/copyfast/claude";
import {
  COPYFAST_SYSTEM_PROMPT,
  buildAnalyzeUserPrompt,
  buildUseAiPrompt,
} from "@/lib/copyfast/prompts";
import { getImageUrlsForAnalyze, itemHasRequiredImage } from "@/lib/copyfast/server";

const LOG_PREFIX = "[copyfast/analyze]";

export async function POST(request, { params }) {
  const { id: projectId, itemId } = await params;
  console.log(LOG_PREFIX, "istek başladı", { projectId, itemId });

  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const allowed = await requireProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const { data: item, error: fetchError } = await supabase
    .from("copyfast_items")
    .select("*")
    .eq("id", itemId)
    .eq("project_id", projectId)
    .single();

  if (fetchError || !item) {
    console.log(LOG_PREFIX, "kayıt bulunamadı", { itemId, fetchError });
    return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
  }

  console.log(LOG_PREFIX, "öğe yüklendi", {
    itemId,
    name: item.name,
    item_type: item.item_type,
    is_responsive: item.is_responsive,
    use_ai: item.use_ai,
    web_image_url: item.web_image_url,
    mobile_image_url: item.mobile_image_url,
    status: item.status,
  });

  if (!itemHasRequiredImage(item)) {
    const msg = item.is_responsive
      ? "Responsive sayfa için web ve mobil görsel gerekli"
      : "Analiz için en az web görseli gerekli";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  await supabase
    .from("copyfast_items")
    .update({
      generated_prompt: "",
      status: "generating",
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId);

  try {
    const { data: project } = await supabase
      .from("projects")
      .select("name")
      .eq("id", projectId)
      .single();

    let generatedPrompt;

    if (item.use_ai) {
      generatedPrompt = buildUseAiPrompt({
        name: item.name,
        description: item.description,
        itemType: item.item_type,
        projectName: project?.name,
      });
    } else {
      const imageUrls = getImageUrlsForAnalyze(item);
      const userPrompt = buildAnalyzeUserPrompt({
        name: item.name,
        description: item.description,
        itemType: item.item_type,
        isResponsive: item.is_responsive,
      });
      console.log(LOG_PREFIX, "Claude analizi başlıyor", {
        itemId,
        name: item.name,
        imageUrls,
        imageCount: imageUrls.length,
      });
      generatedPrompt = await analyzeWithClaude({
        systemPrompt: COPYFAST_SYSTEM_PROMPT,
        userPrompt,
        imageUrls,
      });
      console.log(LOG_PREFIX, "Claude analizi tamamlandı", {
        itemId,
        promptLength: generatedPrompt.length,
      });
    }

    const { data: updated, error: updateError } = await supabase
      .from("copyfast_items")
      .update({
        generated_prompt: generatedPrompt,
        status: "generated",
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId)
      .select()
      .single();

    if (updateError) throw new Error(updateError.message);
    return NextResponse.json(updated);
  } catch (err) {
    const errorMessage = err.message || "Analiz hatası";
    console.error(LOG_PREFIX, "hata", {
      itemId,
      name: item?.name,
      error: errorMessage,
      stack: err.stack,
    });
    const { data: failed } = await supabase
      .from("copyfast_items")
      .update({
        status: "error",
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId)
      .select()
      .single();

    return NextResponse.json(
      { error: errorMessage, item: failed },
      { status: 500 }
    );
  }
}
