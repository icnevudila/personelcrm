"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SettingsTab({
  projectId,
  initialProjectName = "",
  initialProjectDescription = "",
  initialIsArchived = false,
  initialPaymentStatus = "pending",
  initialProjectType = "landing_page",
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    google_analytics_id: "",
    google_search_console: "",
    supabase_account: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [projectName, setProjectName] = useState(initialProjectName);
  const [savedProjectName, setSavedProjectName] = useState(initialProjectName);
  const [projectDescription, setProjectDescription] = useState(initialProjectDescription || "");
  const [savedProjectDescription, setSavedProjectDescription] = useState(initialProjectDescription || "");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState("");
  const [paymentStatus, setPaymentStatus] = useState(initialPaymentStatus);
  const [savedPaymentStatus, setSavedPaymentStatus] = useState(initialPaymentStatus);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentMsg, setPaymentMsg] = useState("");
  const [projectType, setProjectType] = useState(initialProjectType);
  const [savedProjectType, setSavedProjectType] = useState(initialProjectType);
  const [typeSaving, setTypeSaving] = useState(false);
  const [typeMsg, setTypeMsg] = useState("");
  const [isArchived, setIsArchived] = useState(initialIsArchived);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveError, setArchiveError] = useState("");
  const [confirmArchive, setConfirmArchive] = useState(false);

  useEffect(() => {
    fetch(`/api/settings/${projectId}`)
      .then((r) => r.json())
      .then((d) => {
        setForm({
          google_analytics_id: d.google_analytics_id || "",
          google_search_console: d.google_search_console || "",
          supabase_account: d.supabase_account || "",
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [projectId]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const res = await fetch(`/api/settings/${projectId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setMsg("Kaydedildi!");
      setTimeout(() => setMsg(""), 3000);
    } else {
      setMsg("Hata oluştu");
    }
  }

  async function handleProjectInfoSave(e) {
    e.preventDefault();
    const trimmed = projectName.trim();
    if (!trimmed) {
      setNameMsg("Proje adı boş olamaz");
      return;
    }

    const desc = projectDescription.trim();
    const unchanged = trimmed === savedProjectName && desc === savedProjectDescription;
    if (unchanged) return;

    setNameSaving(true);
    setNameMsg("");
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed, description: desc || null }),
    });
    const data = await res.json();
    setNameSaving(false);
    if (res.ok) {
      setProjectName(trimmed);
      setSavedProjectName(trimmed);
      setProjectDescription(desc);
      setSavedProjectDescription(desc);
      setNameMsg("Proje bilgileri güncellendi");
      router.refresh();
      setTimeout(() => setNameMsg(""), 3000);
    } else {
      setNameMsg(data.error || "Hata oluştu");
    }
  }

  async function handlePaymentSave(e) {
    e.preventDefault();
    setPaymentSaving(true);
    setPaymentMsg("");
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment_status: paymentStatus }),
    });
    const data = await res.json();
    setPaymentSaving(false);
    if (res.ok) {
      setSavedPaymentStatus(paymentStatus);
      setPaymentMsg("Ödeme durumu güncellendi");
      router.refresh();
      setTimeout(() => setPaymentMsg(""), 3000);
    } else {
      setPaymentMsg(data.error || "Hata oluştu");
    }
  }

  async function handleTypeSave(e) {
    e.preventDefault();
    setTypeSaving(true);
    setTypeMsg("");
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: projectType }),
    });
    const data = await res.json();
    setTypeSaving(false);
    if (res.ok) {
      setSavedProjectType(projectType);
      setTypeMsg("Proje türü güncellendi");
      router.refresh();
      setTimeout(() => setTypeMsg(""), 3000);
    } else {
      setTypeMsg(data.error || "Hata oluştu");
    }
  }

  async function handleArchiveToggle() {
    setArchiveLoading(true);
    setArchiveError("");
    const nextArchived = !isArchived;
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_archived: nextArchived }),
    });
    const data = await res.json();
    setArchiveLoading(false);
    setConfirmArchive(false);

    if (!res.ok) {
      setArchiveError(data.error || "İşlem başarısız");
      return;
    }

    setIsArchived(nextArchived);
    if (nextArchived) {
      router.push("/dashboard");
    } else {
      router.refresh();
    }
  }

  const inputCls =
    "mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

  if (loading) return <div className="py-8 text-center text-sm text-zinc-400">Yükleniyor…</div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Site Ayarları</h2>
        <p className="text-sm text-zinc-500">
          Proje adı, açıklama, tür, ödeme durumu, Google Analytics, Search Console ve Supabase hesap bilgilerini buradan yönetebilirsiniz.
        </p>
      </div>

      <form
        onSubmit={handleProjectInfoSave}
        className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900"
      >
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Proje Bilgileri</h3>
          <label className="mt-3 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Ad
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className={inputCls}
            placeholder="Proje adı"
            required
          />
          <label className="mt-3 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Açıklama
          </label>
          <textarea
            rows={3}
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            className={`${inputCls} resize-none`}
            placeholder="Proje hakkında kısa açıklama"
          />
          <p className="mt-1.5 text-xs text-zinc-500">
            Dashboard listesinde ve proje özetinde görünür.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {nameMsg && (
            <span
              className={`text-sm font-medium ${nameMsg.includes("Hata") || nameMsg.includes("boş") ? "text-red-600" : "text-emerald-600"}`}
            >
              {nameMsg}
            </span>
          )}
          <button
            type="submit"
            disabled={
              nameSaving ||
              (projectName.trim() === savedProjectName &&
                projectDescription.trim() === savedProjectDescription)
            }
            className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 sm:ml-auto sm:w-auto dark:bg-zinc-100 dark:text-zinc-900"
          >
            {nameSaving ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <form
          onSubmit={handleTypeSave}
          className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Proje Türü</h3>
            <label className="mt-3 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Tür
            </label>
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              className={inputCls}
            >
              <option value="landing_page">Landing Page</option>
              <option value="saas">SaaS</option>
              <option value="mobile_app">Mobile App</option>
            </select>
            <p className="mt-1.5 text-xs text-zinc-500">
              Projenin genel kategorisini belirler; dashboard listesinde görünür.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {typeMsg && (
              <span
                className={`text-sm font-medium ${typeMsg.includes("Hata") ? "text-red-600" : "text-emerald-600"}`}
              >
                {typeMsg}
              </span>
            )}
            <button
              type="submit"
              disabled={typeSaving || projectType === savedProjectType}
              className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 sm:ml-auto sm:w-auto dark:bg-zinc-100 dark:text-zinc-900"
            >
              {typeSaving ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </div>
        </form>

        <form
          onSubmit={handlePaymentSave}
          className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Ödeme Durumu</h3>
            <label className="mt-3 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Durum
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className={inputCls}
            >
              <option value="pending">Beklemede</option>
              <option value="paid">Ödendi</option>
            </select>
            <p className="mt-1.5 text-xs text-zinc-500">
              Ödeme tamamlandığında &quot;Ödendi&quot; olarak işaretleyin.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {paymentMsg && (
              <span
                className={`text-sm font-medium ${paymentMsg.includes("Hata") ? "text-red-600" : "text-emerald-600"}`}
              >
                {paymentMsg}
              </span>
            )}
            <button
              type="submit"
              disabled={paymentSaving || paymentStatus === savedPaymentStatus}
              className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 sm:ml-auto sm:w-auto dark:bg-zinc-100 dark:text-zinc-900"
            >
              {paymentSaving ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </div>
        </form>


      </div>

      <form
        onSubmit={handleSave}
        className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900"
      >
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Google Analytics ID
          </label>
          <input
            type="text"
            value={form.google_analytics_id}
            onChange={(e) => setForm((p) => ({ ...p, google_analytics_id: e.target.value }))}
            className={inputCls}
            placeholder="Örn: G-XXXXXXXXXX"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Supabase Hesap
          </label>
          <input
            type="email"
            value={form.supabase_account}
            onChange={(e) => setForm((p) => ({ ...p, supabase_account: e.target.value }))}
            className={inputCls}
            placeholder="örn: proje@supabase.com"
          />
          <p className="mt-1.5 text-xs text-zinc-500">
            Projenin hangi Supabase e-posta hesabında tutulduğunu yazın.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Search Console
          </label>
          <textarea
            rows={3}
            value={form.google_search_console}
            onChange={(e) => setForm((p) => ({ ...p, google_search_console: e.target.value }))}
            className={`${inputCls} resize-none`}
            placeholder="Doğrulama kodu / property / not"
          />
        </div>

        <div className="flex items-center gap-3">
          {msg && (
            <span
              className={`text-sm font-medium ${msg.startsWith("Hata") ? "text-red-600" : "text-emerald-600"}`}
            >
              {msg}
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="ml-auto rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </form>

      {confirmArchive && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !archiveLoading && setConfirmArchive(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {isArchived ? "Arşivden çıkar" : "Projeyi arşivle"}
            </h3>
            <p className="mt-2 text-sm text-zinc-500">
              {isArchived
                ? "Proje tekrar ana listeye eklenecek. Devam etmek istiyor musunuz?"
                : "Proje ana listeden kaldırılacak ancak silinmeyecek. Devam etmek istiyor musunuz?"}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmArchive(false)}
                disabled={archiveLoading}
                className="flex-1 rounded-lg border border-zinc-200 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleArchiveToggle}
                disabled={archiveLoading}
                className={`flex-1 rounded-lg py-2 text-sm font-medium text-white disabled:opacity-60 ${isArchived
                    ? "bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-amber-600 hover:bg-amber-700"
                  }`}
              >
                {archiveLoading ? "İşleniyor…" : isArchived ? "Geri al" : "Arşivle"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Arşiv</h3>
          <p className="mt-1 text-sm text-zinc-500">
            {isArchived
              ? "Bu proje arşivde. Ana listede görünmez; arşiv sayfasından erişilebilir."
              : "Projeyi arşivlerseniz ana listeden kaldırılır. Veriler silinmez, arşivden geri alabilirsiniz."}
          </p>
          {isArchived && (
            <span className="mt-2 inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              Arşivlenmiş
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setConfirmArchive(true)}
          disabled={archiveLoading}
          className={`w-full rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 sm:w-auto sm:self-end ${isArchived
              ? "border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              : "border-amber-200 text-amber-800 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-400 dark:hover:bg-amber-950/40"
            }`}
        >
          {isArchived ? "Arşivden çıkar" : "Arşivle"}
        </button>
        {archiveError && (
          <p className="text-sm text-red-600">{archiveError}</p>
        )}
      </div>
    </div>
  );
}
