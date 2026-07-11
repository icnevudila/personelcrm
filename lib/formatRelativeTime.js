export function formatRelativeTime(dateInput) {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now - date;
  if (diffMs < 0) return "Az önce";

  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Az önce";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} dakika önce`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} saat önce`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} gün önce`;

  const diffWeek = Math.floor(diffDay / 7);
  if (diffDay < 30) return `${diffWeek} hafta önce`;

  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth} ay önce`;

  const diffYear = Math.floor(diffDay / 365);
  return `${diffYear} yıl önce`;
}
