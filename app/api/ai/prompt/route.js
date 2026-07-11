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

  const form = await request.json();

  const toneMap = {
    formal: "resmi ve kurumsal",
    friendly: "samimi ve sıcak",
    young: "genç ve dinamik",
    premium: "lüks ve premium",
  };

  const goalMap = {
    search: "arama motoru trafiği (SEO odaklı)",
    whatsapp: "WhatsApp üzerinden müşteri iletişimi",
    reservation: "online rezervasyon",
    order: "online sipariş",
  };

  const similarityMap = { low: "az", medium: "orta", high: "çok" };

  const serviceList = Array.isArray(form.services)
    ? form.services.map((s) => `- ${s.name || s}${s.description ? ": " + s.description : ""}`).join("\n")
    : "";

  const regionList = Array.isArray(form.service_regions)
    ? form.service_regions.join(", ")
    : "";

  const menuList = Array.isArray(form.menu_items)
    ? form.menu_items.map((m) => `- ${m.title}${m.description ? ": " + m.description : ""}`).join("\n")
    : "";

  const pagesList = Array.isArray(form.pages) ? form.pages.join(", ") : "";

  const socialLinks = form.social_links
    ? Object.entries(form.social_links)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ")
    : "";

  const colors = form.color_palette
    ? Object.entries(form.color_palette)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ")
    : "";

  const prompt = `# Web Sitesi Geliştirme Prompt'u

Bu prompt, bir AI kod editörüne (Cursor vb.) verilecek ve otomatik olarak tam işlevsel bir web sitesi geliştirilecektir.

---

## İşletme Bilgileri
- **İşletme Adı:** ${form.business_name || "—"}
- **Sektör:** ${form.sector || "—"}
- **Adres:** ${form.address || "—"}
- **Telefon:** ${form.contact_phone || "—"}${form.contact_phone_has_whatsapp ? " (WhatsApp mevcut)" : ""}
${form.landline_phone ? `- **Sabit Hat:** ${form.landline_phone}` : ""}
- **E-posta:** ${form.email || "—"}
- **Google Maps:** ${form.google_maps_link || "—"}

## Çalışma Saatleri
${form.working_hours ? JSON.stringify(form.working_hours, null, 2) : "—"}

## Marka Kimliği
- **Marka Dili:** ${toneMap[form.brand_tone] || form.brand_tone || "—"}
- **Ana Hedef:** ${goalMap[form.main_goal] || form.main_goal || "—"}
- **Slogan:** ${form.slogan || "—"}
- **Renk Paleti:** ${colors || "—"}

## İçerik
**Hakkımızda Metni:**
${form.about_text || "—"}

**Hizmetler:**
${serviceList || "—"}

**Hizmet Bölgeleri:** ${regionList || "—"}

**Menü / Ürünler:**
${menuList || "—"}

## Sosyal Medya
${socialLinks || "—"}

## Sayfa Yapısı
Sitede şu sayfalar olacak: ${pagesList || "—"}

## Rakip / Referans
- **Referans Site:** ${form.competitor_website || "—"}
- **Benzerlik:** ${similarityMap[form.similarity_level] || form.similarity_level || "—"}

## Logo
${form.logo_url ? `Logo dosyası mevcut: ${form.logo_url}` : "Logo henüz yüklenmemiş — siteye uygun bir ikon oluşturun."}

---

## Geliştirme Talimatları

Yukarıdaki bilgileri kullanarak aşağıdaki özelliklere sahip **tam işlevsel, production-ready bir web sitesi** geliştir:

1. **Teknoloji Stack:** Next.js (App Router), Tailwind CSS, responsive tasarım
2. **SEO Optimizasyonu:** Her sayfa için meta tag, structured data (JSON-LD), sitemap
3. **Performans:** Core Web Vitals uyumlu, lazy loading, optimize görseller
4. **Mobil Öncelikli:** Tüm sayfalar mobile-first responsive olmalı
5. **Renk ve Tipografi:** Belirtilen renk paletini ve marka diline uygun font seçimini kullan
6. **Sayfaların İçeriği:** Her sayfayı belirtilen bilgilerle doldur; eksik bilgiler için sektöre uygun içerik üret
7. **WhatsApp Butonu:** ${form.contact_phone_has_whatsapp ? `Tüm sayfalarda sabit WhatsApp butonu ekle (${form.contact_phone})` : "Gerekirse iletişim formu ekle"}
8. **Google Analytics:** ${form.google_analytics_id ? `ID: ${form.google_analytics_id} — entegre et` : "Hazır entegrasyon noktası bırak"}
9. **Ana Hedef CTA:** ${goalMap[form.main_goal] || "İletişim"} için belirgin CTA butonları ekle
10. **İçerik Kalitesi:** Tüm metinler Türkçe, profesyonel ve SEO dostu olmalı

Her sayfayı tamamladıktan sonra bir sonrakine geç. Başarılar!
`;

  return NextResponse.json({ prompt });
}
