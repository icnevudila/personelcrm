import { NextResponse } from "next/server";
import { getAIClient, getAIModel } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { getProjectAccess } from "@/lib/marketing/access";
import { ensureMarketingBlueprint, fetchMarketingData } from "@/lib/marketing/seed";
import {
  AI_COACH_SYSTEM_PROMPT,
  buildAiCoachUserPayload,
  normalizeAiPlan,
} from "@/lib/marketing/aiCoach";
import { applyAiMarketingPlan } from "@/lib/marketing/applyAiPlan";

export async function POST(request, { params }) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY tanımlı değil" }, { status: 500 });
  }

  const { project, allowed } = await getProjectAccess(supabase, user, admin, projectId);
  if (!allowed || !project) {
    return NextResponse.json({ error: "Erişim yok" }, { status: 403 });
  }

  const { data: fullProject } = await supabase
    .from("projects")
    .select("id, name, description, type, setup_prompt")
    .eq("id", projectId)
    .single();

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const userHint = String(body.hint || "").trim();

  try {
    const blueprintId = await ensureMarketingBlueprint(supabase, projectId);
    const marketingData = await fetchMarketingData(supabase, blueprintId);

    const payload = buildAiCoachUserPayload(fullProject || project, marketingData);
    const openai = getAIClient();

    const userContent = userHint
      ? `${JSON.stringify(payload)}\n\nEk kullanıcı talimatı: ${userHint}`
      : JSON.stringify(payload);

    const completion = await openai.chat.completions.create({
      model: getAIModel("gpt-4o-mini"),
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: AI_COACH_SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      temperature: 0.65,
      max_tokens: 4000,
    });

    const raw = completion.choices?.[0]?.message?.content;
    if (!raw) throw new Error("AI boş yanıt döndü");

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("AI yanıtı geçerli JSON değil");
    }

    const plan = normalizeAiPlan(parsed);
    await applyAiMarketingPlan(supabase, blueprintId, plan, marketingData);

    const updatedData = await fetchMarketingData(supabase, blueprintId);

    return NextResponse.json({
      message: plan.message || "Pazarlama planı oluşturuldu ve tüm bölümlere uygulandı.",
      ...updatedData,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "AI Coach hatası: " + (err?.message || "Bilinmeyen hata") },
      { status: 500 }
    );
  }
}
