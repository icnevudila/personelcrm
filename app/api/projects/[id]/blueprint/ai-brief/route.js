import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { getProjectAccess } from "@/lib/productBlueprint/access";
import { ensureProjectBlueprint, fetchBlueprintData } from "@/lib/productBlueprint/seed";
import {
  AI_BRIEF_SYSTEM_PROMPT,
  buildAiBriefUserPayload,
  normalizeAiBrief,
} from "@/lib/productBlueprint/aiBrief";
import { applyAiProductBrief } from "@/lib/productBlueprint/applyAiBrief";

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
    const blueprintId = await ensureProjectBlueprint(supabase, projectId);
    const blueprintData = await fetchBlueprintData(supabase, blueprintId);

    const payload = buildAiBriefUserPayload(fullProject || project, blueprintData);
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const userContent = userHint
      ? `${JSON.stringify(payload)}\n\nEk kullanıcı talimatı: ${userHint}`
      : JSON.stringify(payload);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: AI_BRIEF_SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      temperature: 0.65,
      max_tokens: 4500,
    });

    const raw = completion.choices?.[0]?.message?.content;
    if (!raw) throw new Error("AI boş yanıt döndü");

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("AI yanıtı geçerli JSON değil");
    }

    const brief = normalizeAiBrief(parsed);
    await applyAiProductBrief(supabase, blueprintId, brief, blueprintData);

    const updatedBlueprintData = await fetchBlueprintData(supabase, blueprintId);

    return NextResponse.json({
      message: brief.message || "Blueprint oluşturuldu ve tüm bölümlere uygulandı.",
      project: fullProject || project,
      ...updatedBlueprintData,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "AI Product Assistant hatası: " + (err?.message || "Bilinmeyen hata") },
      { status: 500 }
    );
  }
}
