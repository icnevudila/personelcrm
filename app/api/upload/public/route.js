import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey) {
    return createClient(url, serviceKey, { auth: { persistSession: false } });
  }
  return null;
}

function sanitizeFileName(name) {
  const ext = name.lastIndexOf(".") !== -1 ? name.slice(name.lastIndexOf(".")) : "";
  const base = name.slice(0, name.length - ext.length);
  return (
    base
      .replace(/ğ/g, "g").replace(/Ğ/g, "G")
      .replace(/ü/g, "u").replace(/Ü/g, "U")
      .replace(/ş/g, "s").replace(/Ş/g, "S")
      .replace(/ı/g, "i").replace(/İ/g, "I")
      .replace(/ö/g, "o").replace(/Ö/g, "O")
      .replace(/ç/g, "c").replace(/Ç/g, "C")
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
    + ext.toLowerCase()
  );
}

export async function POST(request) {
  // Service role key varsa RLS'i bypass et, yoksa normal server client dene
  const supabase = createAdminClient() ?? await createServerClient();

  const formData = await request.formData();
  const file = formData.get("file");
  const projectId = formData.get("project_id") || "public";

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Dosya gerekli" }, { status: 400 });
  }

  if (file.size > 3 * 1024 * 1024) {
    return NextResponse.json({ error: "Dosya 3 MB sınırını aşıyor" }, { status: 400 });
  }

  const safeName = sanitizeFileName(file.name);
  const path = `${projectId}/updates/public-${Date.now()}-${safeName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { data, error } = await supabase.storage
    .from("crm-uploads")
    .upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });

  if (error) {
    console.error("[upload/public] Storage error:", error.message, "path:", path);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("crm-uploads").getPublicUrl(data.path);
  return NextResponse.json({ url: urlData.publicUrl });
}
