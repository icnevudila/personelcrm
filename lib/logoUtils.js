export const FIXED_LOGO_PROMPT =
  "Bana kare bir logo tasarla. Logo içinde metin olmayacak. Sektör ile uyumlu bir renk paleti seçmelisin";

export function safeLogoSlug(input) {
  const s = String(input || "")
    .trim()
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");

  return (
    s
      .replace(/[^a-z0-9\s-_.]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^[-_.]+|[-_.]+$/g, "")
      .slice(0, 80) || "logo"
  );
}

export function downloadLogoFile(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function buildDefaultLogoPrompt(projectName, projectDescription = "") {
  const parts = [
    `Marka/proje adı: ${projectName}.`,
    projectDescription?.trim()
      ? `Proje hakkında: ${projectDescription.trim()}.`
      : "Kurumsal ve güven veren bir marka kimliği hedefleniyor.",
    "Logo yalnızca ikon veya sembol olmalı; metin, harf veya kelime içermemeli.",
    "Modern, sade ve profesyonel bir görünüm tercih ediliyor.",
    "Sektöre uygun, dengeli bir renk paleti kullan.",
    "Kare formata uygun, flat ve vektörel tarzda tasarla.",
  ];
  return parts.join(" ");
}

export function isValidLogoPrompt(prompt) {
  return String(prompt || "").trim().length >= 100;
}
