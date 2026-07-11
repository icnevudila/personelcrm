"use client";

import { useEffect, useState, useRef, useMemo } from "react";

import { titlesFromSitePages } from "@/lib/sitePages";

export default function PublicUpdateForm({ token }) {
  const fileRef = useRef(null);
  const [form, setForm] = useState({ title: "", allPages: false, pages: [], description: "", images: [] });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [projectInfo, setProjectInfo] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const pageOptions = useMemo(
    () => titlesFromSitePages(projectInfo?.site_pages),
    [projectInfo?.site_pages]
  );

  useEffect(() => {
    let mounted = true;
    fetch(`/api/updates/public/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        if (data?.error) {
          setError(data.error);
        } else {
          setProjectInfo(data);
          if (data.limit_reached) {
            setError("Güncelleme talep hakkınız dolmuştur, lütfen yöneticiniz ile iletişime geçiniz.");
          }
        }
        setInitialLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setError("Form bilgileri yüklenemedi.");
        setInitialLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [token]);

  async function handleImageUpload(e) {
    const allFiles = Array.from(e.target.files || []);
    e.target.value = "";
    const remaining = 20 - form.images.length;
    if (remaining <= 0) return;
    const files = allFiles.slice(0, remaining);

    setUploading(true);
    setUploadError("");
    const uploaded = [];
    let skipped = 0;

    for (const file of files) {
      if (file.size > 3 * 1024 * 1024) {
        skipped++;
        continue;
      }
      const fd = new FormData();
      fd.append("file", file);
      fd.append("project_id", projectInfo?.project_id || "public");

      const res = await fetch("/api/upload/public", { method: "POST", body: fd });
      const result = await res.json();
      if (res.ok && result.url) {
        uploaded.push(result.url);
      }
    }

    setUploading(false);
    if (uploaded.length > 0) {
      setForm((p) => ({ ...p, images: [...p.images, ...uploaded] }));
    }
    if (skipped > 0) {
      setUploadError(`${skipped} görsel 3 MB sınırını aştığı için atlandı.`);
    }
  }

  function validateForm() {
    if (!form.title.trim()) return "Başlık zorunludur.";
    if (!form.description.trim()) return "Detaylı açıklama zorunludur.";
    if (!form.allPages && pageOptions.length === 0) {
      return "Site için tanımlı sayfa yok. Lütfen \"Tüm Sayfalarda Geçerli\" seçeneğini işaretleyin veya yöneticinize başvurun.";
    }
    if (!form.allPages && form.pages.length === 0) {
      return "Tüm sayfalar veya en az bir sayfa seçmelisiniz.";
    }
    if (projectInfo?.limit_reached) {
      return "Güncelleme talep hakkınız dolmuştur, lütfen yöneticiniz ile iletişime geçiniz.";
    }
    return "";
  }

  async function submitRequest() {
    setSaving(true);
    setError("");
    const pages = form.allPages ? ["Tüm Sayfalar"] : form.pages;
    const res = await fetch(`/api/updates/public/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        pages,
        description: form.description,
        image_urls: form.images,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Gönderim başarısız");
      return;
    }
    setSuccess(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setConfirmOpen(true);
  }

  const togglePage = (page) => {
    setForm((p) => ({
      ...p,
      pages: p.pages.includes(page) ? p.pages.filter((pg) => pg !== page) : [...p.pages, page],
    }));
  };

  if (initialLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent dark:border-zinc-100 dark:border-t-transparent" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl dark:bg-emerald-950">
            ✓
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Talebiniz Alındı!</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Güncelleme talebiniz başarıyla oluşturulmuştur. En kısa sürede ekibimiz istediğiniz güncellemeyi yapacaktır.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Güncelleme Talep Formu</h1>
          <p className="text-sm text-zinc-500">
            {projectInfo?.project_name ? `${projectInfo.project_name} için` : "Web siteniz için"} güncelleme talebinizi iletin.
          </p>
          {projectInfo && (
            <p className="mt-1 text-xs text-zinc-400">
              Kalan talep hakkı: {projectInfo.remaining_request_count}/{projectInfo.max_requests}
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Başlık <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              placeholder="Örn: Ana sayfa başlıkları güncellensin"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={form.allPages}
                onChange={(e) => setForm((p) => ({ ...p, allPages: e.target.checked, pages: [] }))}
                className="rounded"
              />
              Tüm Sayfalarda Geçerli
            </label>

            {!form.allPages && (
              <div>
                <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Hangi Sayfa(lar)?
                </p>
                {pageOptions.length === 0 ? (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                    Kurulumda henüz sayfa tanımlanmamış. Güncelleme için yukarıdan &quot;Tüm Sayfalarda Geçerli&quot;
                    seçeneğini kullanın.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {pageOptions.map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => togglePage(page)}
                        className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${form.pages.includes(page)
                          ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                          : "border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
                          }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Detaylı Açıklama <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              required
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="mt-1 w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              placeholder="Ne değişmesini istiyorsunuz? Detaylı yazın…"
            />
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Örnek Görseller <span className="font-normal text-zinc-400">(opsiyonel, max 20, her biri 3 MB)</span>
            </p>
            <button
              type="button"
              disabled={uploading || form.images.length >= 20}
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 rounded-lg border border-dashed border-zinc-300 px-4 py-2 text-sm text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:hover:border-zinc-500 dark:hover:text-zinc-300"
            >
              {uploading ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
                  Yükleniyor…
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Görsel Ekle
                </>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />

            {uploadError && (
              <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">{uploadError}</p>
            )}

            {form.images.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {form.images.map((url, i) => (
                  <div key={i} className="group relative h-20 w-20 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Görsel ${i + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        setForm((p) => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }))
                      }
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow transition-opacity hover:bg-red-600 group-hover:opacity-100 sm:opacity-0"
                      title="Kaldır"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {form.images.length > 0 && (
              <p className="mt-1.5 text-xs text-zinc-400">
                {form.images.length} görsel eklendi.{" "}
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, images: [] }))}
                  className="text-red-500 hover:text-red-700"
                >
                  Tümünü kaldır
                </button>
              </p>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving || projectInfo?.limit_reached}
            className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {saving ? "Gönderiliyor…" : "Kaydet"}
          </button>
        </form>
      </main>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl dark:bg-zinc-900">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Talebi onaylıyor musunuz?
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Emin misiniz? Kaydettikten sonra bu form tekrar güncellenemez.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="flex-1 rounded-lg border border-zinc-200 py-2 text-sm dark:border-zinc-700"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={async () => {
                  setConfirmOpen(false);
                  await submitRequest();
                }}
                className="flex-1 rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Onayla ve Gönder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
