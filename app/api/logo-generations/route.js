import { NextResponse } from "next/server";
import { getAIClient, getAIModel } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import {
  FIXED_LOGO_PROMPT,
  isValidLogoPrompt,
  safeLogoSlug,
} from "@/lib/logoUtils";

import {
  getLogoProjectAccess,
  LOGO_BUCKET,
  uploadPngBase64ToPublicBucket,
} from "@/lib/logoGenerationsServer";

export async function GET(request) {
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = String(searchParams.get("project_id") || "").trim();
  if (!projectId) {
    return NextResponse.json({ error: "project_id gerekli" }, { status: 400 });
  }

  const { allowed } = await getLogoProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const offset = Math.max(0, Number(searchParams.get("offset") || "0") || 0);
  const limit = 12;

  const { data, error } = await supabase
    .from("logo_generations")
    .select("id, logo_url, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = data || [];
  const nextOffset = items.length === limit ? offset + limit : null;
  return NextResponse.json({ items, nextOffset });
}

export async function POST(request) {
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  const projectId = String(body?.project_id || "").trim();
  const userPrompt = String(body?.prompt || "").trim();

  if (!projectId) {
    return NextResponse.json({ error: "project_id gerekli" }, { status: 400 });
  }
  if (!isValidLogoPrompt(userPrompt)) {
    return NextResponse.json(
      { error: "Prompt en az 100 karakter olmalıdır" },
      { status: 400 }
    );
  }

  const { project, allowed } = await getLogoProjectAccess(supabase, user, admin, projectId);
  if (!allowed || !project) {
    return NextResponse.json({ error: "Erişim yok" }, { status: 403 });
  }

  const fullPrompt = `${FIXED_LOGO_PROMPT}\n\nKullanıcı promptu:\n${userPrompt}`;

  const openai = getAIClient();
  let imageBase64;
  try {
    const r = await openai.images.generate({
      model: "gpt-image-1",
      prompt: fullPrompt,
      size: "1024x1024",
    });
    imageBase64 = r.data?.[0]?.b64_json;
  } catch (e) {
    return NextResponse.json(
      { error: "Görsel üretim hatası: " + (e?.message || "Bilinmeyen hata") },
      { status: 500 }
    );
  }

  if (!imageBase64) {
    return NextResponse.json({ error: "Görsel üretilemedi" }, { status: 500 });
  }

  const bucket = LOGO_BUCKET;
  const filename = `${safeLogoSlug(project.name)}-${Date.now()}.png`;
  const path = `${user.id}/${filename}`;

  let uploaded;
  try {
    uploaded = await uploadPngBase64ToPublicBucket({
      supabase,
      bucket,
      base64: imageBase64,
      path,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Storage yükleme hatası: " + (e?.message || "Bilinmeyen hata") },
      { status: 500 }
    );
  }

  const row = {
    project_id: projectId,
    created_by: user.id,
    fixed_prompt: FIXED_LOGO_PROMPT,
    user_prompt: userPrompt,
    full_prompt: fullPrompt,
    logo_url: uploaded.publicUrl,
    storage_path: uploaded.storagePath,
  };

  const { data, error } = await supabase
    .from("logo_generations")
    .insert(row)
    .select("id, logo_url, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data });
}
