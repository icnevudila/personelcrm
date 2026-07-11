import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request) {

  const { business_name, sector, services, service_regions, brand_tone, main_goal } =
    await request.json();

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const toneMap = {
    formal: "resmi, kurumsal ve güven veren",
    friendly: "samimi, sıcak ve yakın",
    young: "enerjik, genç ve modern",
    premium: "sofistike, premium ve prestijli",
  };

  const serviceList = Array.isArray(services) ? services.map((s) => s.name || s).join(", ") : services || "";
  const regionList = Array.isArray(service_regions) ? service_regions.join(", ") : service_regions || "";

  const systemPrompt = `Sen profesyonel bir web sitesi metin yazarısın. Türkçe olarak etkileyici "Hakkımızda" metinleri yazıyorsun.`;

  const userPrompt = [
    `"${business_name || "İşletme"}" adlı işletme için kapsamlı bir "Hakkımızda" sayfası metni yaz.`,
    `Sektör: ${sector || "genel"}`,
    serviceList ? `Verilen hizmetler: ${serviceList}` : "",
    regionList ? `Hizmet bölgeleri: ${regionList}` : "",
    `Marka dili: ${toneMap[brand_tone] || "profesyonel"}`,
    main_goal === "whatsapp" ? "WhatsApp üzerinden iletişimi teşvik et." : "",
    main_goal === "reservation" ? "Rezervasyon yapmalarını teşvik et." : "",
    main_goal === "order" ? "Sipariş vermelerini teşvik et." : "",
    "Metin en az 200, en fazla 350 kelime olmalıdır.",
    "SEO için anahtar kelimeler doğal biçimde dahil et.",
    "Güven ve profesyonellik vurgusunu ön plana çıkar.",
    "Sadece metni yaz, başlık veya açıklama ekleme.",
  ]
    .filter(Boolean)
    .join(" ");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 600,
  });

  const text = completion.choices[0]?.message?.content?.trim();
  if (!text) return NextResponse.json({ error: "Metin oluşturulamadı" }, { status: 500 });

  return NextResponse.json({ text });
}
