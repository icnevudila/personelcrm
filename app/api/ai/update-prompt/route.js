import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, isAdmin } from "@/lib/isAdmin";
import { NextResponse } from "next/server";

export async function POST(request) {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  if (!isAdmin(user.email)) {
    return NextResponse.json({ error: "Sadece adminler prompt üretebilir" }, { status: 403 });
  }

  const { update_request, project_name } = await request.json();

  const statusMap = { pending: "Beklemede", in_progress: "Yapılıyor", completed: "Tamamlandı" };

  const pagesList = Array.isArray(update_request.pages)
    ? update_request.pages.join(", ")
    : update_request.pages || "—";

  const images = update_request.update_request_images || [];
  const imageList = images.map((img, i) => `${i + 1}. ${img.image_url}`).join("\n");

  const prompt = `# Site Güncelleme Prompt'u

Bu prompt, bir AI kod editörüne (Cursor vb.) verilecek ve otomatik olarak istenen güncelleme yapılacaktır.

---

## Proje Bilgileri
- **Proje Adı:** ${project_name || "—"}
- **Talep ID:** ${update_request.id}
- **Durum:** ${statusMap[update_request.status] || update_request.status}
- **Tarih:** ${new Date(update_request.created_at).toLocaleDateString("tr-TR")}

## Güncelleme Talebi

**Etkilenen Sayfalar:** ${pagesList}

**Detaylı Açıklama:**
${update_request.description}

${images.length > 0 ? `## Referans Görseller\n${imageList}` : ""}

---

## Geliştirme Talimatları

Yukarıdaki güncelleme talebini dikkate alarak:

1. **Belirtilen sayfaları** (${pagesList}) incele
2. **Talep edilen değişiklikleri** tam olarak uygula
3. **Mevcut tasarım dilini** koru — yalnızca istenen bölümleri güncelle
4. **Responsive tasarımı** bozma — mobil/desktop uyumluluğu kontrol et
5. **Görseller** referans olarak verilmişse, içerik/stil için bunları kullan
6. Güncelleme sonrası **build hatası olmadığını** doğrula
7. Her değişikliği yaptıktan sonra kısa açıklama yaz

Sadece talep edilen değişiklikleri yap, gereksiz bölümlere dokunma.
`;

  return NextResponse.json({ prompt });
}
