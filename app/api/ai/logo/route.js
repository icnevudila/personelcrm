import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import OpenAI from "openai";

// Her varyant için farklı ama kurumsal sembol yaklaşımı
const VARIANT_STYLES = [
  "Sade ve sektör ile uyumlu bir logo üretmelisin",
  "Modern bir logo olsun. Karmaşık detaylar oluşturma. Sade ve anlaşılır bir logo olsun. Sektör ile uyumlu bir logo olsun. ",
  "Png formatına çevirip kullanacağız. Arka plan kaldırılabilir bir logo üretmelisin."
];

function buildPrompt(sector, businessName, services, colorPalette, index) {
  const primaryColor = colorPalette?.primary || "#1a1a2e";
  const accentColor = colorPalette?.accent || colorPalette?.secondary || "#4a90d9";
  const bgColor = colorPalette?.background || "#ffffff";

  const serviceHint = Array.isArray(services) && services.length > 0
    ? `İşletme şu bilgileri paylaştı: ${services.slice(0, 3).map((s) => s.name || s).join(", ")}.`
    : "";

  return [
    // Bağlam
    `Bu hizmeti veren kurumsal bir firma için logo üreteceksin. Sektör: ${sector || "genel"}. İşletme adı: ${businessName ? ` "${businessName}"` : ""}.`,
    serviceHint,

    // Varyant
    // `Tasarım yaklaşımı: ${VARIANT_STYLES[variant]}.`,

    // Renk — sadece verilen palet
    `Sana vereceğim örnek renk paleti ile uyumlu bir logo üretmelisin: primary ${primaryColor} and accent ${accentColor} on a solid ${bgColor} background. No gradients, no transparency, no color blending.`,

    "Sade ve sektör ile uyumlu bir logo üretmelisin",
    "Modern bir logo olsun. Karmaşık detaylar oluşturma. Sade ve anlaşılır bir logo olsun. Sektör ile uyumlu bir logo olsun. ",
    "Png formatına çevirip kullanacağız. Arka plan kaldırılabilir bir logo üretmelisin.",

    "vector style, flat design, svg-like, clean edges, centered icon.",

    // Kesin yasaklar
    "KESİN YASAKLAR: NO text, NO letters, NO words, NO numbers, NO initials, NO alphabet characters of any language.",
    "KESİN YASAKLAR: Logo ortada bir ikon benzeri yapıdan oluşmalıdır! Birden fazla kısımlar, birden fazla ikonlar kullanma!",
    "Tek bir logo görseli olmalıdır! Görseli bölüp içine birden fazla kısım ekleme! Sadece tek merkezi bir görsel üretmelisi!",
    "KESİN YASAKLAR: NO multiple disconnected shapes, NO decorative borders, NO background patterns.",
  ].filter(Boolean).join(" ");
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

  const preview_only = false;
  // Prompt kontrolü için: logo üretmeden yalnızca promptları döndür.
  if (preview_only === true) {
    return NextResponse.json({ prompts });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // 3 logo paralel üret (gpt-image-1, her istekten base64 döner)
  let generatedImages;
  try {
    const requests = prompts.map((prompt) =>
      openai.images.generate({
        model: "gpt-image-1",
        prompt,
        size: "1024x1024",
      })
    );
    const responses = await Promise.all(requests);
    generatedImages = responses.map((r) => r.data?.[0]?.b64_json).filter(Boolean);
  } catch (err) {
    return NextResponse.json(
      { error: "Görsel üretim hatası: " + err.message },
      { status: 500 }
    );
  }

  if (!generatedImages || generatedImages.length === 0) {
    return NextResponse.json({ error: "Görsel oluşturulamadı" }, { status: 500 });
  }

  // Her birini Supabase storage'a yükle
  let permanentUrls;
  try {
    permanentUrls = await Promise.all(
      generatedImages.map((imageBase64, i) => uploadToStorage(supabase, imageBase64, project_id, i))
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
