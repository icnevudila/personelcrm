import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { requireProjectAccess, fetchProjectCopyContext } from "@/lib/projectCopy/context";

export async function POST(request, { params }) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY tanımlı değil" }, { status: 500 });
  }

  const allowed = await requireProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const hint = String(body.hint || "").trim();
  const count = Math.min(20, Math.max(5, Number(body.count) || 10));

  try {
    const ctx = await fetchProjectCopyContext(supabase, projectId);

    if (!ctx.contextText.trim()) {
      return NextResponse.json(
        { error: "AI için proje açıklaması veya blueprint kısa açıklaması gerekli." },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("project_name_candidates")
      .select("name")
      .eq("project_id", projectId);

    const existingNames = (existing || []).map((e) => e.name);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = `Sen yaratıcı bir marka isimlendirme uzmanısın.
Proje açıklamalarına göre akılda kalıcı, telaffuzu kolay, modern ürün/marka isimleri üret.
Mevcut proje adını referans alma veya tekrarlama.
Türkçe ve İngilizce karışık isimler üretebilirsin; ürün tipine uygun olsun.
Yanıt YALNIZCA geçerli JSON: {"names":[{"name":"...","notes":"kısa gerekçe"}]}`;

    const userPrompt = [
      ctx.contextText,
      ctx.hasRichContext
        ? "Not: Proje açıklaması ve kısa açıklama dolu — ürünü iyi anlayıp buna uygun isimler üret."
        : "",
      existingNames.length ? `Mevcut isimler (tekrarlama): ${existingNames.join(", ")}` : "",
      hint ? `Ek talimat: ${hint}` : "",
      `${count} farklı isim öner.`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.85,
      max_tokens: 2000,
    });

    const raw = completion.choices?.[0]?.message?.content;
    if (!raw) throw new Error("AI boş yanıt döndü");

    const parsed = JSON.parse(raw);
    const names = Array.isArray(parsed.names) ? parsed.names : [];

    const existingSet = new Set(existingNames.map((n) => n.toLowerCase()));
    const { data: last } = await supabase
      .from("project_name_candidates")
      .select("sort_order")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    let sortOrder = (last?.sort_order ?? -1) + 1;
    const inserted = [];

    for (const item of names) {
      const name = String(item.name || "").trim();
      if (!name || existingSet.has(name.toLowerCase())) continue;

      const { data, error } = await supabase
        .from("project_name_candidates")
        .insert({
          project_id: projectId,
          name,
          notes: String(item.notes || ""),
          source: "ai",
          sort_order: sortOrder++,
        })
        .select()
        .single();

      if (!error && data) {
        inserted.push(data);
        existingSet.add(name.toLowerCase());
      }
    }

    const { data: all } = await supabase
      .from("project_name_candidates")
      .select("*")
      .eq("project_id", projectId)
      .order("is_favorited", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    return NextResponse.json({
      message: `${inserted.length} yeni isim önerisi eklendi.`,
      items: all || [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: "AI isim üretimi hatası: " + (err?.message || "Bilinmeyen hata") },
      { status: 500 }
    );
  }
}
