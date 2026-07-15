import { NextResponse } from "next/server";
import { getAIClient, getAIModel } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const db = await createClient();
    const { user } = await getCurrentUser(db);
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { prompt, type } = await request.json();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt boş olamaz" }, { status: 400 });
    }

    const ai = getAIClient();
    const model = getAIModel();

    if (type === "workflow") {
      const systemPrompt = `Sen güçlü bir AI Otomasyon Mimarı/Mühendisisin. Kullanıcının doğal dil açıklamalarından, yerel otomasyon motorumuz için uygun ve geçerli bir workflow (iş akışı) JSON tanımı oluşturacaksın.

      [MEVCUT NODE TİPLERİ VE YAPILANDIRMALARI]:
      1. 'trigger.manual' (Manuel Tetikleyici): Yapılandırma boş {}
      2. 'data.set' (Değişken/Veri Tanımlama): Config: { "values": { "key": "value" } }
      3. 'logic.if' (Koşul): Config: { "left": "{{ nodes.NODE_ID.output.FIELD }}", "operator": "not_empty"|"equal", "right": "value" }
      4. 'http.request' (HTTP İstekleri): Config: { "method": "GET"|"POST", "url": "https://api.example.com", "headers": {}, "body": "" }
      5. 'ai.chat' (Yapay Zeka Sorusu): Config: { "provider": "auto", "systemPrompt": "...", "prompt": "..." }
      6. 'telegram.send' (Telegram Bildirimi): Config: { "chatId": "...", "text": "..." }
      7. 'crm.create' (CRM Kayıt Ekleme): Config: { "tableId": "...", "values": {} }

      [JSON FORMATI]:
      Yanıtın SADECE şu formatta bir JSON olmalıdır:
      {
        "plan": "Akışın kısa bir açıklaması...",
        "nodes": [
          {
            "id": "benzersiz-id-1",
            "type": "trigger.manual",
            "name": "Tetikleyici Adı",
            "position": { "x": 100, "y": 100 },
            "config": {}
          }
        ],
        "edges": [
          {
            "id": "benzersiz-id-1-benzersiz-id-2",
            "source": "benzersiz-id-1",
            "target": "benzersiz-id-2",
            "sourceHandle": "success" (if ve koşul durumunda "true" veya "false")
          }
        ]
      }

      JSON dışında hiçbir şey döndürme. Kod blokları (\`\`\`json) ekleme. Sadece saf JSON döndür.`;

      const response = await ai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Açıklama: ${prompt}` },
        ],
        temperature: 0.3,
      });

      const responseText = response.choices?.[0]?.message?.content || "";
      const cleaned = responseText.trim().replace(/^```json/, "").replace(/```$/, "").trim();
      const parsed = JSON.parse(cleaned);

      return NextResponse.json(parsed);
    } else if (type === "social") {
      const systemPrompt = `Sen bir Sosyal Medya İçerik Planlama Uzmanısın (Social OS Co-pilot). Kullanıcının hedefine uygun olarak X (Twitter) veya Instagram için taslak içerik planları ve medya önerileri oluşturacaksın.

      Her önerilen içerik için:
      - 'platform': "x" veya "instagram"
      - 'title': Kısa açıklayıcı başlık
      - 'body': { "text": "Paylaşılacak metin..." }
      - 'mediaPrompt': Eğer bir görsel/video üretilmek isteniyorsa, bunu üretmek için kullanılacak detaylı İngilizce görsel üretim promptu.

      [JSON FORMATI]:
      Yanıtın SADECE şu formatta bir JSON olmalıdır:
      {
        "plan": "Planlama özeti...",
        "items": [
          {
            "platform": "x" | "instagram",
            "title": "İçerik Başlığı",
            "body": { "text": "Tweet veya post metni..." },
            "mediaPrompt": "Detailed English image prompt to generate visual using AI (e.g. A developer coding in a neon-lit cyber room, 3D render...)"
          }
        ]
      }

      JSON dışında hiçbir şey döndürme. Kod blokları (\`\`\`json) ekleme. Sadece saf JSON döndür.`;

      const response = await ai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Sosyal medya kampanya hedefi: ${prompt}` },
        ],
        temperature: 0.7,
      });

      const responseText = response.choices?.[0]?.message?.content || "";
      const cleaned = responseText.trim().replace(/^```json/, "").replace(/```$/, "").trim();
      const parsed = JSON.parse(cleaned);

      return NextResponse.json(parsed);
    } else {
      return NextResponse.json({ error: "Geçersiz tip" }, { status: 400 });
    }
  } catch (error) {
    console.error("AI Builder Hatası:", error);
    return NextResponse.json({ error: error.message || "Bilinmeyen hata" }, { status: 500 });
  }
}
