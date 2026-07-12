import { NextResponse } from "next/server";
import { getAIClient, getAIModel } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { requireProjectAccess, fetchProjectCopyContext } from "@/lib/projectCopy/context";

const COPY_TYPES = ["slogan", "sales_copy", "tagline", "headline"];

export async function POST(request, { params }) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });


  const allowed = await requireProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const hint = String(body.hint || "").trim();
  const copy_type = body.copy_type || "slogan";
  if (!COPY_TYPES.includes(copy_type)) {
    return NextResponse.json({ error: "Geçersiz metin tipi" }, { status: 400 });
  }

  const count = Math.min(15, Math.max(3, Number(body.count) || 6));

  try {
    const ctx = await fetchProjectCopyContext(supabase, projectId);

    if (!ctx.contextText.trim()) {
      return NextResponse.json(
        { error: "AI için proje açıklaması veya blueprint kısa açıklaması gerekli." },
        { status: 400 }
      );
    }

    const typeLabels = {
      slogan: "kısa, akılda kalıcı slogan",
      sales_copy: "ikna edici satış metni (1-3 cümle)",
      tagline: "marka tagline",
      headline: "dikkat çekici başlık",
    };

    const openai = getAIClient();

    const systemPrompt = `Sen yaratıcı bir copywriter'sın.
Proje bağlamına göre Türkçe ${typeLabels[copy_type]} üret.
Yanıt YALNIZCA geçerli JSON: {"items":[{"content":"...","notes":"kısa not"}]}`;

    const userPrompt = [
      ctx.contextText,
      ctx.hasRichContext
        ? "Not: Proje açıklaması ve kısa açıklama dolu — ürünü net anlayıp ona uygun metinler yaz."
        : "",
      hint ? `Ek talimat: ${hint}` : "",
      `${count} farklı öneri üret.`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const completion = await openai.chat.completions.create({
      model: getAIModel("gpt-4o-mini"),
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 2500,
    });

    const raw = completion.choices?.[0]?.message?.content;
    if (!raw) throw new Error("AI boş yanıt döndü");

    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed.items) ? parsed.items : [];

    const { data: last } = await supabase
      .from("project_slogans")
      .select("sort_order")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    let sortOrder = (last?.sort_order ?? -1) + 1;
    let insertedCount = 0;

    for (const item of items) {
      const content = String(item.content || "").trim();
      if (!content) continue;

      const { error } = await supabase.from("project_slogans").insert({
        project_id: projectId,
        content,
        copy_type,
        notes: String(item.notes || ""),
        source: "ai",
        sort_order: sortOrder++,
      });

      if (!error) insertedCount++;
    }

    const { data: all } = await supabase
      .from("project_slogans")
      .select("*")
      .eq("project_id", projectId)
      .order("is_favorited", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    return NextResponse.json({
      message: `${insertedCount} yeni metin eklendi.`,
      items: all || [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: "AI metin üretimi hatası: " + (err?.message || "Bilinmeyen hata") },
      { status: 500 }
    );
  }
}
