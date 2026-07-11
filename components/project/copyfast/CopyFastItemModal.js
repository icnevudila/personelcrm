"use client";

import { useEffect, useRef, useState } from "react";
import { uploadCopyfastImage } from "@/lib/copyfast/clientApi";

const inputCls =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";
const textareaCls =
  "w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 min-h-[4rem]";

export default function CopyFastItemModal({
  open,
  onClose,
  onSave,
  projectId,
  itemId,
  initial = {},
  parentId = null,
  pendingFile = null,
}) {
  const webRef = useRef(null);
  const mobileRef = useRef(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [itemType, setItemType] = useState("page");
  const [isResponsive, setIsResponsive] = useState(false);
  const [useAi, setUseAi] = useState(false);
  const [webPreview, setWebPreview] = useState(null);
  const [mobilePreview, setMobilePreview] = useState(null);
  const [webFile, setWebFile] = useState(null);
  const [mobileFile, setMobileFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(initial.name || "");
    setDescription(initial.description || "");
    setItemType(initial.item_type || (parentId ? "component" : "page"));
    setIsResponsive(Boolean(initial.is_responsive));
    setUseAi(Boolean(initial.use_ai));
    setWebPreview(initial.web_image_url || null);
    setMobilePreview(initial.mobile_image_url || null);
    setWebFile(null);
    setMobileFile(null);
    setError("");
    setSaving(false);

    if (pendingFile) {
      setWebFile(pendingFile);
      setWebPreview(URL.createObjectURL(pendingFile));
      if (!initial.name) {
        const base = pendingFile.name.replace(/\.[^.]+$/, "");
        setName(base);
      }
    }
  }, [open, initial, parentId, pendingFile]);

  if (!open) return null;

  function handleFileSelect(file, type) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("Dosya 10 MB sınırını aşıyor");
      return;
    }
    const url = URL.createObjectURL(file);
    if (type === "mobile") {
      setMobileFile(file);
      setMobilePreview(url);
    } else {
      setWebFile(file);
      setWebPreview(url);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Ad gerekli");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const saved = await onSave({
        name: name.trim(),
        description: description.trim(),
        item_type: itemType,
        is_responsive: isResponsive,
        use_ai: useAi,
        parent_id: itemType === "component" ? parentId : null,
      });

      const targetId = saved.id || itemId;
      if (webFile && targetId) {
        const updated = await uploadCopyfastImage(projectId, targetId, webFile, "web");
        saved.web_image_url = updated.web_image_url;
      }
      if (mobileFile && targetId) {
        const updated = await uploadCopyfastImage(projectId, targetId, mobileFile, "mobile");
        saved.mobile_image_url = updated.mobile_image_url;
      }

      onClose(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={() => !saving && onClose()} aria-hidden="true" />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {itemId ? "Düzenle" : "Yeni Ekle"}
          </h3>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Tür</label>
            <select
              value={itemType}
              onChange={(e) => setItemType(e.target.value)}
              className={inputCls}
              disabled={Boolean(parentId)}
            >
              <option value="page">Sayfa</option>
              <option value="component">Bileşen</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Ad</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Ana Sayfa" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Açıklama</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={textareaCls}
              placeholder="Sayfa/bileşen açıklaması"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={isResponsive}
              onChange={(e) => setIsResponsive(e.target.checked)}
              className="rounded"
            />
            Responsive sayfa (web + mobil görsel)
          </label>

          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input type="checkbox" checked={useAi} onChange={(e) => setUseAi(e.target.checked)} className="rounded" />
            use_ai (Claude olmadan genel prompt)
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Web Görsel</label>
              <div
                onClick={() => webRef.current?.click()}
                className="relative flex h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 text-xs text-zinc-500 hover:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-800"
              >
                {webPreview ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={webPreview} alt="" className="h-full w-full rounded-xl object-cover" />
                ) : (
                  "Yükle veya sürükle"
                )}
              </div>
              <input
                ref={webRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0], "web")}
              />
            </div>

            {isResponsive ? (
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Mobil Görsel</label>
                <div
                  onClick={() => mobileRef.current?.click()}
                  className="relative flex h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 text-xs text-zinc-500 hover:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-800"
                >
                  {mobilePreview ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={mobilePreview} alt="" className="h-full w-full rounded-xl object-cover" />
                  ) : (
                    "Yükle veya sürükle"
                  )}
                </div>
                <input
                  ref={mobileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0], "mobile")}
                />
              </div>
            ) : null}
          </div>

          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          ) : null}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {saving ? "Kaydediliyor…" : itemId ? "Güncelle" : "Kaydet"}
            </button>
            <button
              type="button"
              onClick={() => onClose()}
              disabled={saving}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400"
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
