export const COPYFAST_SYSTEM_PROMPT = `Sen bir UI/UX tasarım analisti ve Next.js geliştirme prompt mühendisisin.
Görevin: verilen ekran görüntüsünü (veya görüntüleri) detaylı analiz ederek, Cursor AI editöründe kullanılacak bir Next.js implementasyon promptu üretmek.

Analiz etmen gerekenler:
- Tasarım dili ve genel estetik
- Renk paleti (hex kodlarıyla)
- Tipografi (font ailesi, boyutlar, ağırlıklar, satır yüksekliği)
- Spacing sistemi (padding, margin, gap değerleri)
- Border radius değerleri
- Gölge ve derinlik kullanımı
- Bileşen yapısı ve hiyerarşi
- Layout (grid, flex, responsive davranış)
- İkonografi ve görsel öğeler
- Hover/focus/active durumları (tahmin edilebiliyorsa)
- Mobil vs masaüstü farkları (iki görsel varsa)

Çıktı formatı:
- Markdown formatında yaz
- Tailwind CSS sınıfları kullan
- Next.js App Router yapısına uygun component önerileri ver
- Her bölüm için somut değerler belirt (px, rem, hex)
- Türkçe açıklamalar ekle ama kod/class isimleri İngilizce olsun
- Sadece prompt metnini döndür, ek açıklama yapma`;

export function buildAnalyzeUserPrompt({ name, description, itemType, isResponsive }) {
  const typeLabel = itemType === "component" ? "bileşen" : "sayfa";
  const parts = [
    `Bu bir ${typeLabel} tasarımıdır.`,
    `Ad: ${name}`,
  ];
  if (description?.trim()) parts.push(`Açıklama: ${description.trim()}`);
  if (isResponsive) {
    parts.push(
      "İki görsel gönderildi: ilki masaüstü (web), ikincisi mobil görünüm. Responsive davranışı da analiz et."
    );
  } else {
    parts.push("Tek görsel gönderildi: masaüstü (web) görünümü.");
  }
  parts.push(
    "Bu tasarımı Next.js + Tailwind CSS ile birebir uygulamak için detaylı bir geliştirme promptu üret."
  );
  return parts.join("\n");
}

export function buildUseAiPrompt({ name, description, itemType, projectName }) {
  const typeLabel = itemType === "component" ? "Bileşen" : "Sayfa";
  return `# ${typeLabel}: ${name}

## Proje
${projectName || "Proje"}

## Açıklama
${description?.trim() || "Açıklama girilmedi."}

## Geliştirme Talimatı
Bu ${typeLabel.toLowerCase()} için modern, temiz bir Next.js (App Router) + Tailwind CSS implementasyonu oluştur.

### Gereksinimler
- Responsive tasarım (mobile-first)
- Erişilebilirlik standartlarına uygun
- Temiz component yapısı
- Tutarlı spacing ve tipografi sistemi

### Bileşen Yapısı
\`\`\`
components/${itemType === "component" ? "ui" : "sections"}/${slugify(name)}.js
\`\`\`

Adımları sırayla uygula ve her bölümü Tailwind sınıflarıyla stilize et.`;
}

export function buildProjectPrompt({ projectName, items }) {
  const sections = items
    .filter((i) => i.generated_prompt?.trim())
    .map((i) => `## ${i.item_type === "component" ? "Bileşen" : "Sayfa"}: ${i.name}\n\n${i.generated_prompt}`)
    .join("\n\n---\n\n");

  return `# ${projectName || "Proje"} — Birleşik Tasarım Sistemi Promptu

Bu prompt, projenin tüm sayfa ve bileşenlerinin analiz sonuçlarını birleştirir.

${sections}

## Genel Talimat
Yukarıdaki tüm sayfa ve bileşenleri tutarlı bir tasarım sistemi içinde Next.js App Router projesine uygula.
Ortak renk paleti, tipografi ve spacing değerlerini tüm bileşenlerde tutarlı kullan.`;
}

function slugify(text) {
  return String(text || "item")
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "item";
}
