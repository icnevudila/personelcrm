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

    const { messages, context } = await request.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Geçersiz mesaj geçmişi" }, { status: 400 });
    }

    const ai = getAIClient();
    const model = getAIModel();

    const systemPrompt = `Sen bu uygulamadaki kullanıcıların asistanı ve iş ortağı olan güçlü bir AI Co-Pilot / Ajanısın.
    Kullanıcıya hem sistemi nasıl kullanacağını öğretecek, hem de sorduğu sorulara göre akışları ve içerikleri yönetmesine yardım edeceksin.

    Şu anki ekran bağlamı (Context):
    - Tip: ${context?.type || "Bilinmiyor"}
    - Mevcut Durum (JSON): ${JSON.stringify(context?.state || {})}

    [YAPABİLECEĞİN EYLEMLER (ACTIONS)]:
    Eğer konuşma esnasında kullanıcının talebi doğrultusunda ekrana bir şey eklemen veya güncellemen gerekirse, yanıtının en sonuna SADECE şu formatta bir JSON bloğu ekle (kullanıcı bunu arayüzde görmeyecek, sistem otomatik icra edecek):
    
    Aksiyon Tipleri:
    1. Workflow Ekranı İçin:
       - Node Ekle: { "action": { "type": "ADD_NODE", "nodeType": "trigger.manual" | "data.set" | "logic.if" | "http.request" | "ai.chat" | "telegram.send" | "crm.create" } }
       - Node Bağla: { "action": { "type": "CONNECT_NODES", "sourceId": "...", "targetId": "..." } }
       - Node Sil: { "action": { "type": "DELETE_NODE", "nodeId": "..." } }
    
    2. Social OS Ekranı İçin:
       - Taslak Ekle: { "action": { "type": "CREATE_SOCIAL_DRAFT", "platform": "x" | "instagram", "title": "Taslak Başlığı", "body": { "text": "Paylaşılacak metin..." }, "mediaPrompt": "Optional visual prompt..." } }

    [YANIT FORMATI]:
    Yanıtın iki kısımdan oluşmalıdır:
    1. Kullanıcıya yazacağın açıklayıcı, cana yakın ve yol gösterici Türkçe mesaj (Markdown formatında).
    2. Eğer bir aksiyon tetiklenecekse, mesajın bittiği yerde en altta \`\`\`json şeklinde aksiyon nesnesi.
    
    Örnek:
    Merhaba! İstediğin gibi X platformu için bir taslak hazırlıyorum.
    \`\`\`json
    {
      "action": {
        "type": "CREATE_SOCIAL_DRAFT",
        "platform": "x",
        "title": "Yeni SaaS Lansmanı",
        "body": { "text": "Yeni projemiz yayında! 🚀" }
      }
    }
    \`\`\`

    Kullanıcıya karşı samimi ve profesyonel ol.`;

    const response = await ai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
    });

    const reply = response.choices?.[0]?.message?.content || "";
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("AI Co-Pilot Hatası:", error);
    return NextResponse.json({ error: error.message || "Bilinmeyen hata" }, { status: 500 });
  }
}
