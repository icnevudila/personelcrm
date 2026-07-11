"use client";

const DAYS = [
  { key: "monday", label: "Pazartesi" },
  { key: "tuesday", label: "Salı" },
  { key: "wednesday", label: "Çarşamba" },
  { key: "thursday", label: "Perşembe" },
  { key: "friday", label: "Cuma" },
  { key: "saturday", label: "Cumartesi" },
  { key: "sunday", label: "Pazar" },
];

// 00:00 – 23:30 arası yarım saatlik aralıklar
const TIMES = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

// DB'den gelen herhangi bir formatı normalize et
// Sonuç: { open: bool, is24h: bool, openTime: "HH:MM", closeTime: "HH:MM" }
function normalize(raw) {
  if (!raw) return { open: false, is24h: false, openTime: "09:00", closeTime: "18:00" };

  // Eski format: { closed, is24h, open: "09:00", close: "18:00" }
  if ("closed" in raw) {
    return {
      open: !raw.closed,
      is24h: raw.is24h || false,
      openTime: raw.open || "09:00",
      closeTime: raw.close || "18:00",
    };
  }

  // Yeni format (zaten normalize)
  return {
    open: raw.open ?? false,
    is24h: raw.is24h || false,
    openTime: raw.openTime || "09:00",
    closeTime: raw.closeTime || "18:00",
  };
}

// Üst bileşene her zaman eski (DB uyumlu) format gönder
function toDbFormat(days) {
  return Object.fromEntries(
    DAYS.map(({ key }) => {
      const d = days[key];
      return [key, {
        closed: !d.open,
        is24h: d.is24h,
        open: d.openTime,
        close: d.closeTime,
      }];
    })
  );
}

const selectCls =
  "rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-800 " +
  "focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200";

// --- Tamamen controlled bileşen — kendi local state'i yok ---
// value prop'u InstallationForm'un form.working_hours state'inden gelir;
// her değişiklik onChange ile üste iletilir.
export default function WorkingHours({ value, onChange }) {
  // value string olarak gelebilir (DB text kolonu) — parse et
  const parsed = (() => {
    if (!value) return null;
    if (typeof value === "string") { try { return JSON.parse(value); } catch { return null; } }
    return value;
  })();

  const days = Object.fromEntries(
    DAYS.map(({ key }) => [key, normalize(parsed?.[key])])
  );

  function update(key, changes) {
    const updated = {
      ...days,
      [key]: { ...days[key], ...changes },
    };
    onChange(toDbFormat(updated));
  }

  return (
    <div className="space-y-2">
      {DAYS.map(({ key, label }) => {
        const day = days[key];
        return (
          <div
            key={key}
            className={`rounded-xl border px-4 py-3 transition-all ${day.open
                ? "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                : "border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/30"
              }`}
          >
            {/* Gün başlığı + switch */}
            <div className="flex items-center justify-between gap-3">
              <span
                className={`w-24 shrink-0 text-sm font-medium ${day.open
                    ? "text-zinc-800 dark:text-zinc-200"
                    : "text-zinc-400 dark:text-zinc-500"
                  }`}
              >
                {label}
              </span>

              <div className="flex items-center gap-2.5">
                {!day.open && (
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">Kapalı</span>
                )}

                {/* Toggle switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={day.open}
                  onClick={() => update(key, { open: !day.open })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${day.open
                      ? "bg-zinc-900 dark:bg-zinc-100"
                      : "bg-zinc-200 dark:bg-zinc-600"
                    }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform dark:bg-zinc-900 ${day.open ? "translate-x-5" : "translate-x-0"
                      }`}
                  />
                </button>
              </div>
            </div>

            {/* Saat seçimleri — switch açıkken */}
            {day.open && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {/* Açılış saati (veya 24 Saat) */}
                <div className="flex flex-col gap-0.5">
                  <label className="text-xs text-zinc-400 dark:text-zinc-500">Açılış</label>
                  <select
                    value={day.is24h ? "24h" : day.openTime}
                    onChange={(e) => {
                      if (e.target.value === "24h") {
                        update(key, { is24h: true });
                      } else {
                        update(key, { is24h: false, openTime: e.target.value });
                      }
                    }}
                    className={selectCls}
                  >
                    <option value="24h">24 Saat</option>
                    <option disabled>──────────</option>
                    {TIMES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Kapanış saati — 24h değilse */}
                {!day.is24h && (
                  <>
                    <span className="mt-4 text-zinc-300 dark:text-zinc-600">—</span>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-xs text-zinc-400 dark:text-zinc-500">Kapanış</label>
                      <select
                        value={day.closeTime}
                        onChange={(e) => update(key, { closeTime: e.target.value })}
                        className={selectCls}
                      >
                        {TIMES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {day.is24h && (
                  <span className="mt-4 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                    Tüm gün açık
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
