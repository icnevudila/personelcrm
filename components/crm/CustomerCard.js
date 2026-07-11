"use client";

import { useState } from "react";

const STATUS_OPTIONS = [
  { value: "pending", label: "Bekliyor", color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
  { value: "callback", label: "Tekrar Ara", color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400" },
  { value: "positive", label: "Olumlu", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" },
  { value: "negative", label: "Olumsuz", color: "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400" },
];

function statusLabel(v) {
  return STATUS_OPTIONS.find((o) => o.value === v)?.label ?? v;
}

function statusColor(v) {
  return STATUS_OPTIONS.find((o) => o.value === v)?.color ?? "";
}

export default function CustomerCard({ customer, isOpen, onToggle, onSaved }) {
  const [status, setStatus] = useState(customer.status);
  const [note, setNote] = useState(customer.note || "");
  const [callbackDate, setCallbackDate] = useState(
    customer.callback_date ? customer.callback_date.slice(0, 10) : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (status === "callback" && !callbackDate) {
      setError("Tekrar Ara seçildiğinde tarih zorunludur.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const body = { status, note };
      if (status === "callback" && callbackDate) {
        body.callback_date = callbackDate;
      } else {
        body.callback_date = null;
      }

      const res = await fetch(`/api/crm/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Kayıt başarısız");
      const updated = await res.json();
      onSaved(updated);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  const phoneClean = customer.phone_number?.replace(/[^0-9+]/g, "") || "";
  const whatsappUrl = phoneClean
    ? `https://wa.me/${phoneClean.startsWith("+") ? phoneClean.slice(1) : "90" + phoneClean.replace(/^0/, "")}`
    : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900">
      {/* Ana satır */}
      <div
        className="cursor-pointer p-4"
        onClick={onToggle}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p
              className={`font-semibold text-zinc-900 dark:text-zinc-50 ${isOpen ? "whitespace-normal break-words" : "truncate"}`}
            >
              {customer.business_name || "—"}
            </p>
            <p className="mt-0.5 text-sm text-zinc-500">
              {customer.phone_number || "Telefon yok"}
              {customer.province && (
                <span className="ml-2 text-zinc-400">
                  {customer.province}
                  {customer.district ? ` / ${customer.district}` : ""}
                </span>
              )}
            </p>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(customer.status)}`}>
            {statusLabel(customer.status)}
          </span>
        </div>

        {/* Aksiyon butonları */}
        <div className="mt-3 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
          {phoneClean && (
            <a
              href={`tel:${phoneClean}`}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              📞 <span>Ara</span>
            </a>
          )}
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-green-200 px-2.5 py-1.5 text-xs text-green-600 hover:bg-green-50 dark:border-green-900 dark:text-green-400 dark:hover:bg-green-950"
            >
              🟢 <span>WhatsApp</span>
            </a>
          )}
          {customer.maps_url && (
            <a
              href={customer.maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              📍 <span>Harita</span>
            </a>
          )}
        </div>
      </div>

      {/* Detay kısım */}
      {isOpen && (
        <div className="border-t border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
          <div className="space-y-3">
            {/* Durum seçimi */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-500">Durum</label>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStatus(opt.value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${status === opt.value
                        ? opt.color + " ring-2 ring-offset-1 ring-zinc-400"
                        : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-600"
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Callback tarihi */}
            {status === "callback" && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                  Tekrar Ara Tarihi
                </label>
                <input
                  type="date"
                  value={callbackDate}
                  onChange={(e) => setCallbackDate(e.target.value)}
                  required
                  aria-invalid={!!error}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
                {error && (
                  <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                    {error}
                  </p>
                )}
              </div>
            )}

            {/* Not */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-500">Not</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Müşteri hakkında not ekleyin..."
                className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-xl bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
