export const HELP_MESSAGE = `🤖 <b>AI COO Asistan</b>

Kişisel operasyon asistanın. Projelerini yönetir, öneriler sunar.

<b>📋 Yapabileceklerim</b>
• Proje durumu ve raporlar
• Todo oluşturma / tamamlama
• Blueprint okuma ve güncelleme
• Marketing planı ve içerik önerileri
• Deep Work planı (2 saatlik odak)
• Günlük / haftalık özet
• Launch hazırlık analizi
• Brain dump → Todo/Inbox
• Sesli mesaj desteği

<b>💬 Örnek Komutlar</b>
• Restaurant QR durumunu göster
• Bugün ne yapmalıyım?
• Yeni Todo oluştur: landing hero güncelle
• Marketing planı hazırla
• Launch'a hazır mıyız?
• Bu hafta neye odaklanmalıyım?
• QR ödeme özelliği ekle
• Twitter için içerik üret
• Bugünkü Deep Work planını oluştur
• Restaurant QR Blueprint'ini güncelle

<b>⚡ Slash Komutlar</b>
/help /projects /project /todo /marketing
/blueprint /deepwork /report /weekly
/launch /status

Doğal dil de desteklenir — komut yazmana gerek yok.`;

export function formatProjectsList(projects) {
  if (!projects.length) return "Henüz aktif proje yok.";
  return projects
    .map((p, i) => `${i + 1}. <b>${escapeHtml(p.name)}</b> — ${p.status}`)
    .join("\n");
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
