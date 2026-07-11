import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { normalizeTables } from "@/lib/dbSchemaUtils";

async function getProjectAccess(supabase, user, admin, projectId) {
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, name, description, user_id")
    .eq("id", projectId)
    .single();

  if (error || !project) return { project: null, allowed: false };
  if (admin || project.user_id === user.id) return { project, allowed: true };
  return { project, allowed: false };
}

const SYSTEM_PROMPT = `Sen Supabase/PostgreSQL veritabanı şema tasarım asistanısın.
Kullanıcının proje bağlamına ve mevcut şemaya göre tablo/alan/ilişki öner veya güncelle.

Kurallar:
- Yanıt YALNIZCA geçerli JSON olsun.
- Format: { "message": "Türkçe kısa açıklama", "tables": [ ... ] }
- Her tablo: { "id", "name", "x", "y", "columns": [ { "id", "name", "type", "isPk", "fkRef"? } ] }
- type değerleri: uuid, text, int4, bool, timestamptz, jsonb
- fkRef: { "tableId": "hedef_tablo_id", "column": "hedef_kolon_adı" }
- Mevcut tablo/kolon id'lerini mümkün olduğunca koru; yeni eklemeler için kısa benzersiz id üret (örn. nanoid benzeri)
- Her tabloda en az bir primary key (genelde uuid id) olsun
- Tablo adları snake_case
- Supabase uyumlu, ilişkileri fkRef ile tanımla
- Sadece istenen değişiklikleri yap; gereksiz tablo silme`;

export async function POST(request, { params }) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { project, allowed } = await getProjectAccess(supabase, user, admin, projectId);
  if (!allowed || !project) {
    return NextResponse.json({ error: "Erişim yok" }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  const userMessage = String(body.message || "").trim();
  if (!userMessage) {
    return NextResponse.json({ error: "Mesaj gerekli" }, { status: 400 });
  }

  const projectContext = String(body.project_context || "");
  const currentTables = normalizeTables(body.schema_data?.tables || []);
  const recentMessages = Array.isArray(body.recent_messages) ? body.recent_messages.slice(-8) : [];

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const userPayload = {
    project_name: project.name,
    project_description: project.description || "",
    project_context: projectContext,
    current_schema: { tables: currentTables },
    user_request: userMessage,
    recent_chat: recentMessages.map((m) => ({ role: m.role, content: m.content })),
  };

  let parsed;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: JSON.stringify(userPayload),
        },
      ],
      temperature: 0.2,
    });

    const raw = completion.choices?.[0]?.message?.content;
    if (!raw) throw new Error("Boş yanıt");
    parsed = JSON.parse(raw);
  } catch (e) {
    return NextResponse.json(
      { error: "AI yanıt hatası: " + (e?.message || "Bilinmeyen hata") },
      { status: 500 }
    );
  }

  const tables = normalizeTables(parsed.tables || currentTables);
  const message =
    String(parsed.message || "").trim() ||
    "Şema güncellendi. Soldaki tuvalde değişiklikleri inceleyebilirsiniz.";

  return NextResponse.json({
    message,
    schema_data: { tables },
  });
}
