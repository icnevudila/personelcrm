import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const IMAGEN_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImages";

function buildPrompt(sector, businessName, services, colorPalette, index) {
  const primaryColor = colorPalette?.primary || "#1a1a2e";
  const accentColor = colorPalette?.accent || colorPalette?.secondary || "#4a90d9";
  const bgColor = colorPalette?.background || "#ffffff";

  const serviceHint =
    Array.isArray(services) && services.length > 0
      ? `Business provides: ${services.slice(0, 3).map((s) => s.name || s).join(", ")}.`
      : "";

  const variants = [
    "Minimalist icon-only logo with geometric shapes.",
    "Modern flat design logo with a bold abstract symbol.",
    "Clean professional logo with a unique icon mark.",
  ];

  return [
    `Professional corporate logo for a ${sector || "business"} company${businessName ? ` named "${businessName}"` : ""}.`,
    serviceHint,
    variants[index] || variants[0],
    `Color palette: primary ${primaryColor}, accent ${accentColor}, on solid ${bgColor} background.`,
    "Vector style, flat design, clean edges, centered icon.",
    "NO text, NO letters, NO words, NO numbers, NO initials, NO alphabet characters.",
    "Single centered icon only. No multiple shapes, no decorative borders, no background patterns.",
    "High quality, professional, scalable logo design.",
  ]
    .filter(Boolean)
    .join(" ");
}

async function generateWithImagen(prompt) {
  // Use Pollinations AI for free, keyless, fast logo generation
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true&private=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Görsel sunucusundan yanıt alınamadı");
  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

async function uploadToStorage(supabase, imageBase64, projectId, index) {
  if (!imageBase64) throw new Error("Base64 görsel verisi bulunamadı");
  const buffer = Buffer.from(imageBase64, "base64");
  const path = `${projectId}/ai-logo-${Date.now()}-${index}.png`;
  const { data, error } = await supabase.storage
    .from("crm-logos")
    .upload(path, buffer, { contentType: "image/png", upsert: true });

  if (error) throw new Error(error.message);

  const { data: urlData } = supabase.storage.from("crm-logos").getPublicUrl(data.path);
  return urlData.publicUrl;
}

export async function POST(request) {
  const supabase = await createClient();

  const { business_name, sector, services, color_palette, project_id } =
    await request.json();

  if (!project_id) {
    return NextResponse.json({ error: "project_id gerekli" }, { status: 400 });
  }

  const prompts = [0, 1, 2].map((i) =>
    buildPrompt(sector, business_name, services, color_palette, i)
  );

  // 3 logo üret (sırayla)
  let generatedImages = [];
  const errors = [];

  for (let i = 0; i < prompts.length; i++) {
    try {
      const b64 = await generateWithImagen(prompts[i]);
      generatedImages.push(b64);
    } catch (err) {
      console.error(`[logo] Varyant ${i} hata:`, err.message);
      errors.push(err.message);
    }
  }

  if (generatedImages.length === 0) {
    return NextResponse.json(
      { error: "Görsel üretilemedi: " + errors[0] },
      { status: 500 }
    );
  }

  // Storage'a yükle
  let permanentUrls;
  try {
    permanentUrls = await Promise.all(
      generatedImages.map((b64, i) => uploadToStorage(supabase, b64, project_id, i))
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Storage yükleme hatası: " + err.message },
      { status: 500 }
    );
  }

  // installation_forms tablosuna kaydet
  await supabase
    .from("installation_forms")
    .update({ logo_ai_urls: permanentUrls, logo_generate: true })
    .eq("project_id", project_id);

  return NextResponse.json({ urls: permanentUrls });
}
