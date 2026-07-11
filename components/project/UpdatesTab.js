"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import PromptModal from "@/components/installation/PromptModal";
import { titlesFromSitePages } from "@/lib/sitePages";

const STATUS_LABEL = { pending: "Beklemede", in_progress: "Yapılıyor", completed: "Tamamlandı", cancelled: "İptal Edildi" };
const STATUS_COLOR = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  cancelled: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

export default function UpdatesTab({ projectId, projectName, isAdmin, publicToken }) {
  const supabase = createClient();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", allPages: false, pages: [], description: "", images: [] });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [promptModal, setPromptModal] = useState(null);
  const [promptLoading, setPromptLoading] = useState(null);
  const [copied, setCopied] = useState(false);
  const [sitePageRows, setSitePageRows] = useState([]);
  const fileRef = useRef(null);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const publicUpdateUrl = publicToken ? `${origin}/public/update/${publicToken}` : null;

  const pageOptions = useMemo(() => titlesFromSitePages(sitePageRows), [sitePageRows]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("site_pages")
        .select("title, sort_order")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true });
      if (!cancelled && !error) setSitePageRows(data || []);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    fetch(`/api/updates?project_id=${projectId}`)
      .then((r) => r.json())
      .then((d) => {
        setRequests(Array.isArray(d) ? d : []);
        setLoading(false);
      });
  }, [projectId]);

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files || []).slice(0, 20 - form.images.length);
    const uploaded = [];
    for (const file of files) {
      if (file.size > 3 * 1024 * 1024) continue;
      const path = `${projectId}/updates/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage.from("crm-uploads").upload(path, file, { upsert: true });
      if (!error && data) {
        const { data: urlData } = supabase.storage.from("crm-uploads").getPublicUrl(data.path);
        uploaded.push(urlData.publicUrl);
      }
    }
    setForm((p) => ({ ...p, images: [...p.images, ...uploaded] }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setSaveMsg("Başlık ve detaylı açıklama zorunludur.");
      return;
    }
    if (!form.allPages && pageOptions.length === 0) {
      setSaveMsg("Site için tanımlı sayfa yok. \"Tüm Sayfalar\" seçin veya kurulumda sayfa ekleyin.");
      return;
    }
    if (!form.allPages && form.pages.length === 0) {
      setSaveMsg("Tüm sayfalar veya en az bir sayfa seçmelisiniz.");
      return;
    }
    setSaving(true);
    setSaveMsg("");
    const pages = form.allPages ? ["Tüm Sayfalar"] : form.pages;
    const res = await fetch("/api/updates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        title: form.title,
        pages,
        description: form.description,
        image_urls: form.images,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setSaveMsg("Hata: " + (data.error || "Bilinmeyen"));
      return;
    }
    setRequests((p) => [data, ...p]);
    setShowForm(false);
    setForm({ title: "", allPages: false, pages: [], description: "", images: [] });
  }

  async function handleStatusChange(id, status) {
    const res = await fetch(`/api/updates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setRequests((p) => p.map((r) => (r.id === id ? { ...r, status } : r)));
    }
  }

  async function handlePrompt(req) {
    setPromptLoading(req.id);
    try {
      const res = await fetch("/api/ai/update-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ update_request: req, project_name: projectName }),
      });
      const data = await res.json();
      setPromptModal(data.prompt || "");
    } finally {
      setPromptLoading(null);
    }
  }

  const togglePage = (page) => {
    setForm((p) => ({
      ...p,
      pages: p.pages.includes(page)
        ? p.pages.filter((pg) => pg !== page)
        : [...p.pages, page],
    }));
  };

  async function handleCopy() {
    if (!publicUpdateUrl) return;
    await navigator.clipboard.writeText(publicUpdateUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Güncelleme Talepleri</h2>
        <div className="flex items-center gap-2">
          {publicUpdateUrl && (
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${copied
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : "border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-200"
                }`}
            >
              {copied ? (
                <>✓ Kopyalandı!</>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Paylaş
                </>
              )}
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            + Yeni Güncelleme
          </button>
        </div>
      </div>

      {/* Yeni talep formu */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <h3 className="font-medium text-zinc-900 dark:text-zinc-50">Yeni Güncelleme Talebi</h3>

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
              placeholder="Örn: İletişim sayfası formu güncellensin"
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
              Tüm Sayfalar
            </label>

            {!form.allPages &&
              (pageOptions.length === 0 ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  Henüz kurulumda sayfa tanımlanmamış. Yukarıdan &quot;Tüm Sayfalar&quot; seçin veya önce kurulum
                  formunda sayfa ekleyin.
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
              ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Detaylı Açıklama <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="mt-1 w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              placeholder="Hangi değişikliği istiyorsunuz? Detaylı açıklayın…"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Görseller (opsiyonel, maks. 20, 3 MB)
            </label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-1 rounded-lg border border-dashed border-zinc-300 px-4 py-2 text-sm text-zinc-500 hover:border-zinc-400 dark:border-zinc-600"
            >
              + Görsel Ekle
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
            {form.images.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {form.images.map((url, i) => (
                  <div key={i} className="group relative h-16 w-16 overflow-hidden rounded-lg bg-zinc-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        setForm((p) => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }))
                      }
                      className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white opacity-0 group-hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {saveMsg && <p className="text-sm text-red-600">{saveMsg}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 rounded-lg border border-zinc-200 py-2 text-sm dark:border-zinc-700"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </div>
        </form>
      )}

      {/* Talep listesi */}
      {loading ? (
        <div className="py-8 text-center text-sm text-zinc-400">Yükleniyor…</div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500">Henüz güncelleme talebi yok.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[req.status] || STATUS_COLOR.pending}`}
                  >
                    {STATUS_LABEL[req.status] || req.status}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {new Date(req.created_at).toLocaleDateString("tr-TR")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <>
                      <select
                        value={req.status}
                        onChange={(e) => handleStatusChange(req.id, e.target.value)}
                        className="rounded border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      >
                        <option value="pending">Beklemede</option>
                        <option value="in_progress">Yapılıyor</option>
                        <option value="completed">Tamamlandı</option>
                        <option value="cancelled">İptal Edildi</option>
                      </select>
                      <button
                        onClick={() => handlePrompt(req)}
                        disabled={promptLoading === req.id}
                        className="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                      >
                        {promptLoading === req.id ? "…" : "Prompt"}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {req.pages?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {req.pages.map((p, i) => (
                    <span
                      key={i}
                      className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              )}

              {req.title && (
                <p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {req.title}
                </p>
              )}
              <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{req.description}</p>

              {req.update_request_images?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {req.update_request_images.map((img, i) => (
                    <a key={i} href={img.image_url} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.image_url}
                        alt=""
                        className="h-14 w-14 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {promptModal && (
        <PromptModal text={promptModal} onClose={() => setPromptModal(null)} />
      )}
    </div>
  );
}
