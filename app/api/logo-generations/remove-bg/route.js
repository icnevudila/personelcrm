import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { safeLogoSlug } from "@/lib/logoUtils";
import {
  getLogoProjectAccess,
  LOGO_BUCKET,
  uploadBufferToPublicBucket,
} from "@/lib/logoGenerationsServer";

export async function POST(request) {
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const apiKey = process.env.REMOVEBG_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "REMOVEBG_API_KEY tanımlı değil" }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  const projectId = String(body?.project_id || "").trim();
  const sourceLogoId = String(body?.source_logo_id || "").trim();

  if (!projectId || !sourceLogoId) {
    return NextResponse.json({ error: "project_id ve source_logo_id gerekli" }, { status: 400 });
  }

  const { project, allowed } = await getLogoProjectAccess(supabase, user, admin, projectId);
  if (!allowed || !project) {
    return NextResponse.json({ error: "Erişim yok" }, { status: 403 });
  }

  const { data: sourceLogo, error: sourceError } = await supabase
    .from("logo_generations")
    .select("id, logo_url, project_id")
    .eq("id", sourceLogoId)
    .single();

  if (sourceError || !sourceLogo) {
    return NextResponse.json({ error: "Kaynak logo bulunamadı" }, { status: 404 });
  }
  if (sourceLogo.project_id !== projectId) {
    return NextResponse.json({ error: "Logo bu projeye ait değil" }, { status: 403 });
  }

  let removeBgResponse;
  try {
    const formData = new URLSearchParams();
    formData.append("image_url", sourceLogo.logo_url);
    formData.append("size", "auto");
    formData.append("format", "png");

    removeBgResponse = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": apiKey },
      body: formData,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Remove.bg bağlantı hatası: " + (e?.message || "Bilinmeyen hata") },
      { status: 502 }
    );
  }

  if (!removeBgResponse.ok) {
    let detail = "";
    try {
      detail = await removeBgResponse.text();
    } catch {
      detail = "";
    }
    return NextResponse.json(
      { error: "Arka plan silinemedi: " + (detail || removeBgResponse.statusText) },
      { status: 502 }
    );
  }

  const imageBuffer = Buffer.from(await removeBgResponse.arrayBuffer());
  const filename = `${safeLogoSlug(project.name)}-nobg-${Date.now()}.png`;
  const path = `${user.id}/${filename}`;

  let uploaded;
  try {
    uploaded = await uploadBufferToPublicBucket({
      supabase,
      bucket: LOGO_BUCKET,
      buffer: imageBuffer,
      path,
      contentType: "image/png",
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
    fixed_prompt: "",
    user_prompt: "",
    full_prompt: "",
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
