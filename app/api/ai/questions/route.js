import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const { business_name, sector, services = [], about_text = "" } = await req.json();

    if (!sector) {
      return NextResponse.json({ error: "Sektör bilgisi gereklidir." }, { status: 400 });
    }

    // Bağlam oluştur
    const serviceList = services.length > 0
      ? services.map((s) => (s.description ? `${s.name} (${s.description})` : s.name)).join(", ")
      : "";

    const contextParts = [];
    if (business_name) contextParts.push(`İşletme adı: ${business_name}`);
    contextParts.push(`Sektör: ${sector}`);
    if (serviceList) contextParts.push(`Hizmetler: ${serviceList}`);
    if (about_text) contextParts.push(`Kısa tanıtım: ${about_text}`);

    const contextText = contextParts.join(". ");

    const systemPrompt = `Sen bir web tasarım ajansının müşteri bilgi toplama uzmanısın.
Müşteri hakkında az bilgin var ve sitenin içeriğini daha iyi planlayabilmek için 3 soru sorman gerekiyor.
Sorular kısa, net ve sektöre özel olmalı.
Her soru müşterinin işini, ne öne çıkarmak istediğini veya hedef kitlesini anlamana yardımcı olmalı.
Yanıtı SADECE geçerli JSON olarak ver, başka hiçbir şey ekleme.`;

    const userPrompt = `${contextText}.

Bu müşteri için web sitesi yapıyorum. Sitenin içeriğini ve mesajını doğru kurabilmek için müşteriye soracağım 3 soru üret.
Sorular kısa (maksimum 15 kelime) ve yanıtlaması kolay olsun.

Yanıtı şu JSON formatında ver:
{"questions": ["Soru 1", "Soru 2", "Soru 3"]}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);

    const questions = Array.isArray(parsed.questions)
      ? parsed.questions.slice(0, 3).filter((q) => typeof q === "string" && q.trim())
      : [];

    if (questions.length === 0) {
      return NextResponse.json({ error: "Sorular üretilemedi." }, { status: 500 });
    }

    return NextResponse.json({ questions });
  } catch (err) {
    console.error("[api/ai/questions]", err);
    return NextResponse.json({ error: err.message || "Sunucu hatası" }, { status: 500 });
  }
}
