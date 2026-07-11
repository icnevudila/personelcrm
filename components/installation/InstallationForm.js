"use client";

import { useState, useRef, useEffect } from "react";
import WorkingHours from "./WorkingHours";
import ColorPalette from "./ColorPalette";
import LogoSection from "./LogoSection";
import PageSelector from "./PageSelector";
import PromptModal from "./PromptModal";
import { createClient } from "@/lib/supabase/client";
import { titlesFromSitePages } from "@/lib/sitePages";

// ─── Sabitler ────────────────────────────────────────────────────────────────

const BRAND_TONES = [
  { value: "formal", label: "Resmi" },
  { value: "friendly", label: "Samimi" },
  { value: "young", label: "Genç" },
  { value: "premium", label: "Premium" },
];
const SIMILARITY_LEVELS = [
  { value: "low", label: "Az" },
  { value: "medium", label: "Orta" },
  { value: "high", label: "Çok" },
];
const MAIN_GOALS = [
  { value: "search", label: "Arama (SEO)" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "reservation", label: "Rezervasyon" },
  { value: "order", label: "Sipariş" },
];

const WIZARD_STEPS = [
  { id: 1, title: "Temel Bilgiler" },
  { id: 2, title: "Çalışma Saatleri" },
  { id: 3, title: "Hizmetler" },
  { id: 4, title: "Hizmet Bölgeleri" },
  { id: 5, title: "İçerik" },
  { id: 6, title: "Domain Adayları" },
  { id: 7, title: "Marka Kimliği" },
  { id: 8, title: "Renk Paleti" },
  { id: 9, title: "Logo" },
  { id: 10, title: "Site Görselleri" },
  { id: 11, title: "Sayfalar" },
  { id: 12, title: "Menü ve Ürünler" },
  { id: 13, title: "Sosyal Medya" },
  { id: 14, title: "İstekleriniz" },
];
const TOTAL_STEPS = WIZARD_STEPS.length; // 14

// ─── Yardımcı Fonksiyonlar ───────────────────────────────────────────────────

function formatPhone(raw, type) {
  const digits = raw.replace(/\D/g, "");
  if (type === "mobile") {
    if (digits.length === 0) return "";
    const d = digits.startsWith("0") ? digits : "0" + digits;
    const t = d.slice(0, 11);
    if (t.length <= 4) return t;
    if (t.length <= 7) return `${t.slice(0, 4)} ${t.slice(4)}`;
    if (t.length <= 9) return `${t.slice(0, 4)} ${t.slice(4, 7)} ${t.slice(7)}`;
    return `${t.slice(0, 4)} ${t.slice(4, 7)} ${t.slice(7, 9)} ${t.slice(9)}`;
  } else {
    const d = digits.startsWith("0") ? digits : "0" + digits;
    const t = d.slice(0, 11);
    if (t.length <= 4) return t;
    if (t.length <= 7) return `${t.slice(0, 4)} ${t.slice(4)}`;
    if (t.length <= 10) return `${t.slice(0, 4)} ${t.slice(4, 7)} ${t.slice(7)}`;
    return `${t.slice(0, 4)} ${t.slice(4, 7)} ${t.slice(7, 10)} ${t.slice(10)}`;
  }
}

function normalizeDomain(input) {
  if (!input) return "";

  let d = input
    // TR karakter dönüşümü (büyük → küçük öncesi)
    .replace(/Ç/g, "C").replace(/ç/g, "c")
    .replace(/Ğ/g, "G").replace(/ğ/g, "g")
    .replace(/İ/g, "I").replace(/ı/g, "i")
    .replace(/Ö/g, "O").replace(/ö/g, "o")
    .replace(/Ş/g, "S").replace(/ş/g, "s")
    .replace(/Ü/g, "U").replace(/ü/g, "u")
    .toLowerCase()
    // Protokol ve yol kısımlarını temizle
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    // Tüm boşlukları (içteki dahil) sil
    .replace(/\s+/g, "")
    // Geçersiz karakterleri sil — domain'de sadece harf, rakam, tire, nokta olabilir
    .replace(/[^a-z0-9.\-]/g, "")
    // Ardışık noktaları tek noktaya indir
    .replace(/\.{2,}/g, ".")
    // Baştaki ve sondaki nokta/tireyi temizle
    .replace(/^[.\-]+|[.\-]+$/g, "");

  if (!d) return "";

  // Uzantı yoksa .com ekle (örn: "mybusiness" → "mybusiness.com")
  if (!d.includes(".")) d = d + ".com";

  return d;
}

// ─── Domain Yardımcı Bileşenleri (bileşen dışında — focus kaybı olmaz) ────────

function AvailabilityBadge({ info }) {
  if (!info) return null;
  if (info.loading) {
    return (
      <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">
        <span className="h-2.5 w-2.5 animate-spin rounded-full border border-zinc-400 border-t-transparent" />
        Kontrol ediliyor…
      </span>
    );
  }
  if (info.available === null) return null;
  if (info.available) {
    return (
      <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
        ✓ Uygun
      </span>
    );
  }
  return (
    <span
      className="ml-1 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/50 dark:text-red-400"
      title={info.registrar ? `Kayıtlı: ${info.registrar}` : undefined}
    >
      ✗ Uygun Değil
    </span>
  );
}

function DomainInputRow({ domainInput, setDomainInput, onAdd }) {
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={domainInput}
        onChange={(e) => setDomainInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onAdd(domainInput);
          }
        }}
        className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        placeholder="örnek.com veya example.com"
      />
      <button
        onClick={() => onAdd(domainInput)}
        className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
      >
        + Ekle
      </button>
    </div>
  );
}

function DomainList({ domains, availability, onRemove }) {
  if (domains.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {domains.map((d, i) => (
        <span
          key={i}
          className="flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1 font-mono text-xs dark:border-zinc-700"
        >
          {d}
          <AvailabilityBadge info={availability[d]} />
          <button
            onClick={() => onRemove(i)}
            className="ml-1 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}

// ─── Ana Bileşen ─────────────────────────────────────────────────────────────

export default function InstallationForm({
  initialData,
  projectId,
  isAdmin,
  onSave,
  apiUrl,
  method = "PUT",
  isPublic = false,
  wizard = false,
}) {
  const supabase = createClient();

  // Wizard navigasyon
  // Lazy initializer: form yalnızca client-side render edildiği için (PublicInstallationForm
  // loading spinner gösterir), SSR hydration çakışması olmadan URL'den adımı okuyabiliriz.
  const [step, setStep] = useState(() => {
    if (typeof window !== "undefined" && wizard) {
      const adim = parseInt(
        new URLSearchParams(window.location.search).get("adim") || "0",
        10
      );
      if (!isNaN(adim) && adim >= 0 && adim <= 15) return adim;
    }
    return 0;
  });
  const [stepError, setStepError] = useState("");

  // stepError 6 saniye sonra otomatik kapansın
  useEffect(() => {
    if (!stepError) return;
    const t = setTimeout(() => setStepError(""), 6000);
    return () => clearTimeout(t);
  }, [stepError]);

  // Adım değişince URL'yi güncelle (history.replaceState — sayfayı yeniden yüklemez)
  useEffect(() => {
    if (!wizard) return;
    const url = new URL(window.location.href);
    if (step === 0 || step === 15) {
      url.searchParams.delete("adim");
    } else {
      url.searchParams.set("adim", String(step));
    }
    history.replaceState(null, "", url.toString());
  }, [step, wizard]);

  // Form state
  const [form, setForm] = useState({
    business_name: initialData?.business_name || "",
    contact_phone: initialData?.contact_phone || "",
    contact_phone_has_whatsapp: initialData?.contact_phone_has_whatsapp || false,
    landline_phone: initialData?.landline_phone || "",
    email: initialData?.email || "",
    address: initialData?.address || "",
    google_maps_link: initialData?.google_maps_link || "",
    sector: initialData?.sector || "",
    logo_url: initialData?.logo_url || "",
    logo_generate: initialData?.logo_generate !== false,
    logo_ai_urls: Array.isArray(initialData?.logo_ai_urls) ? initialData.logo_ai_urls : [],
    about_text: initialData?.about_text || "",
    about_generate: initialData?.about_generate || false,
    slogan: initialData?.slogan || "",
    brand_tone: initialData?.brand_tone || "",
    competitor_website: initialData?.competitor_website || "",
    similarity_level: initialData?.similarity_level || "",
    main_goal: initialData?.main_goal || "",
    color_palette_mode: initialData?.color_palette_mode || (initialData?.color_generate ? "ai" : "preset"),
    color_generate: initialData?.color_generate || false,
    color_ai_palettes: (() => {
      const raw = initialData?.color_ai_palettes;
      if (Array.isArray(raw)) return raw;
      if (typeof raw === "string") {
        try {
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return [];
    })(),
    kvkk_required: initialData?.kvkk_required || false,
    privacy_required: initialData?.privacy_required || false,
    authorized_person_phone: initialData?.authorized_person_phone || "",
    color_palette: initialData?.color_palette || null,
    working_hours: (() => {
      const wh = initialData?.working_hours;
      if (!wh) return null;
      if (typeof wh === "string") { try { return JSON.parse(wh); } catch { return null; } }
      return wh;
    })(),
    pages: titlesFromSitePages(initialData?.site_pages),
    social_links: initialData?.social_links || {},
    gallery_images: initialData?.gallery_images || [],
    is_completed: initialData?.is_completed || false,
  });

  const sitePagesSyncKey = JSON.stringify(titlesFromSitePages(initialData?.site_pages));
  useEffect(() => {
    setForm((p) => ({ ...p, pages: titlesFromSitePages(initialData?.site_pages) }));
  }, [sitePagesSyncKey]);

  const [services, setServices] = useState(
    Array.isArray(initialData?.services) ? initialData.services : []
  );
  const [serviceInput, setServiceInput] = useState({ name: "", description: "" });
  const [regions, setRegions] = useState(
    Array.isArray(initialData?.service_regions) ? initialData.service_regions : []
  );
  const [regionInput, setRegionInput] = useState("");
  const [menuItems, setMenuItems] = useState(
    Array.isArray(initialData?.menu_items) ? initialData.menu_items : []
  );
  const [menuInput, setMenuInput] = useState({ title: "", description: "" });
  const [requestedDomains, setRequestedDomains] = useState(
    Array.isArray(initialData?.requested_domains) ? initialData.requested_domains : []
  );
  const [domainInput, setDomainInput] = useState("");
  // domain → {available: bool|null, loading: bool, registrar: string|null}
  const [domainAvailability, setDomainAvailability] = useState(
    typeof initialData?.domain_availability === "object" && initialData.domain_availability !== null
      ? Object.fromEntries(
        Object.entries(initialData.domain_availability).map(([d, v]) => [
          d,
          { available: v.available, loading: false, registrar: v.registrar || null },
        ])
      )
      : {}
  );

  // Form tamamlandıysa salt okunur modda aç (admin her zaman düzenleyebilir)
  const isCompleted = !isAdmin && (form.is_completed === true);

  const [site_requests, setSiteRequests] = useState(initialData?.site_requests || "");

  // status: wizard karşılama ekranında gösterilir, admin güncelleyebilir
  const [formStatus, setFormStatus] = useState(initialData?.status || "pending");

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [aiLoading, setAiLoading] = useState({});
  const [confirmModal, setConfirmModal] = useState(false);
  const [promptModal, setPromptModal] = useState(false);
  const [promptText, setPromptText] = useState("");
  const galleryInputRef = useRef(null);

  const set = (key, val) => { if (isCompleted) return; setForm((p) => ({ ...p, [key]: val })); };
  const setSocial = (key, val) =>
    setForm((p) => ({ ...p, social_links: { ...p.social_links, [key]: val } }));

  const isMobile = (phone) => phone.replace(/\D/g, "").startsWith("05");

  // ─── Domain Uygunluk Kontrolü ────────────────────────────────────────────────

  async function checkDomainAvailability(domain) {
    // Daha önce kontrol edildiyse tekrar sorgu atma
    if (domainAvailability[domain] && !domainAvailability[domain].loading) return;

    setDomainAvailability((p) => ({ ...p, [domain]: { available: null, loading: true, registrar: null } }));
    try {
      const res = await fetch("/api/domains/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      const data = await res.json();
      setDomainAvailability((p) => ({
        ...p,
        [domain]: {
          available: res.ok ? data.available : null,
          loading: false,
          registrar: data.registrar || null,
        },
      }));
    } catch {
      setDomainAvailability((p) => ({ ...p, [domain]: { available: null, loading: false, registrar: null } }));
    }
  }

  // ─── Kaydetme ───────────────────────────────────────────────────────────────

  async function handleSave(markCompleted = false) {
    setSaving(true);
    setSaveMsg("");
    // CHECK kısıtlamalı enum alanlar boş string ise null gönder
    const ENUM_FIELDS = ["brand_tone", "similarity_level", "main_goal"];
    const sanitized = { ...form };
    for (const field of ENUM_FIELDS) {
      if (sanitized[field] === "") sanitized[field] = null;
    }

    // domain_availability'yi DB formatına çevir: {domain: {available, registrar}}
    const domainAvailabilityForDb = Object.fromEntries(
      Object.entries(domainAvailability)
        .filter(([, v]) => !v.loading && v.available !== null)
        .map(([d, v]) => [d, { available: v.available, registrar: v.registrar }])
    );

    const payload = {
      ...sanitized,
      services,
      service_regions: regions,
      menu_items: menuItems,
      requested_domains: requestedDomains,
      domain_availability: domainAvailabilityForDb,
      site_requests,
      is_completed: markCompleted ? true : form.is_completed,
      status: markCompleted ? "in_review" : formStatus,
    };
    let res, data;
    try {
      res = await fetch(apiUrl, {
        method: isPublic ? "PUT" : method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      data = await res.json();
    } catch (err) {
      console.error("[InstallationForm] Ağ hatası:", err);
      setSaving(false);
      setSaveMsg("Ağ hatası: " + err.message);
      return { ok: false, error: "Ağ hatası: " + err.message };
    }
    setSaving(false);
    if (!res.ok) {
      const errMsg = data?.error || `HTTP ${res.status}`;
      console.error("[InstallationForm] Kaydetme hatası:", errMsg, "| payload keys:", Object.keys(payload));
      setSaveMsg("Hata: " + errMsg);
      return { ok: false, error: errMsg };
    }
    setSaveMsg(markCompleted ? "Gönderildi!" : "Kaydedildi!");
    setTimeout(() => setSaveMsg(""), 3000);
    onSave?.(data);
    if (data?.site_pages) {
      setForm((p) => ({ ...p, pages: titlesFromSitePages(data.site_pages) }));
    }
    return { ok: true };
  }

  async function persistColorPaletteFields(fields) {
    try {
      const res = await fetch(apiUrl, {
        method: isPublic ? "PUT" : method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "AI renk paleti kaydedilemedi.");
      onSave?.(data);
      if (data?.site_pages) {
        setForm((p) => ({ ...p, pages: titlesFromSitePages(data.site_pages) }));
      }
      return { ok: true };
    } catch (err) {
      console.error("[InstallationForm] AI renk paleti otomatik kayıt hatası:", err);
      setSaveMsg("AI renk paleti kaydedilemedi. Lütfen Kaydet ile tekrar deneyin.");
      setTimeout(() => setSaveMsg(""), 3500);
      return { ok: false, error: err.message };
    }
  }

  // ─── AI Fonksiyonları ────────────────────────────────────────────────────────

  async function handleAI(type) {
    setAiLoading((p) => ({ ...p, [type]: true }));
    try {
      const res = await fetch(`/api/ai/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: form.business_name,
          sector: form.sector,
          brand_tone: form.brand_tone,
          main_goal: form.main_goal,
          services,
          service_regions: regions,
          color_palette: form.color_palette,
        }),
      });
      const data = await res.json();
      if (type === "about") set("about_text", data.text || "");
      if (type === "colors") set("color_palette", data.palettes?.[0]?.colors || null);
    } finally {
      setAiLoading((p) => ({ ...p, [type]: false }));
    }
  }

  async function handlePrompt() {
    setAiLoading((p) => ({ ...p, prompt: true }));
    try {
      const res = await fetch("/api/ai/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          services,
          service_regions: regions,
          menu_items: menuItems,
          requested_domains: requestedDomains,
        }),
      });
      const data = await res.json();
      setPromptText(data.prompt || "");
      setPromptModal(true);
    } finally {
      setAiLoading((p) => ({ ...p, prompt: false }));
    }
  }

  async function handleGalleryUpload(e) {
    const files = Array.from(e.target.files || []).slice(0, 20 - form.gallery_images.length);
    const uploaded = [];
    for (const file of files) {
      if (file.size > 3 * 1024 * 1024) continue;
      const path = `${projectId || "public"}/gallery/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from("crm-uploads")
        .upload(path, file, { upsert: true });
      if (!error && data) {
        const { data: urlData } = supabase.storage.from("crm-uploads").getPublicUrl(data.path);
        uploaded.push(urlData.publicUrl);
      }
    }
    set("gallery_images", [...form.gallery_images, ...uploaded]);
  }

  // ─── Adım Doğrulaması ────────────────────────────────────────────────────────

  function validateStep(s) {
    switch (s) {
      case 1:
        if (!form.business_name.trim()) return "İşletme adı zorunludur.";
        if (!form.sector.trim()) return "Sektör zorunludur.";
        if (!form.contact_phone.trim()) return "Cep telefonu zorunludur.";
        if (!form.email.trim()) return "E-posta zorunludur.";
        if (!form.address.trim()) return "Adres zorunludur.";
        return null;
      case 2:
        if (!form.working_hours) return "Çalışma saatleri doldurulmalıdır.";
        if (!Object.values(form.working_hours).some((d) => !d.closed))
          return "En az bir gün açık olarak işaretlenmelidir.";
        return null;
      case 3:
        if (services.length === 0) return "En az bir hizmet eklenmelidir.";
        return null;
      case 4:
        if (regions.length === 0) return "En az bir hizmet bölgesi eklenmelidir.";
        return null;
      case 5:
        if (!form.about_text.trim()) return "Hakkımızda metni zorunludur.";
        return null;
      case 6:
        if (requestedDomains.length === 0) return "En az bir domain adayı eklenmelidir.";
        return null;
      case 7:
        return null;
      case 8:
        if (!form.color_palette) return "Renk paleti seçilmelidir.";
        return null;
      case 9:
        if (!form.logo_url) return "Logo seçilmeli veya yüklenmelidir.";
        return null;
      case 10:
        return null;
      case 11:
        if (!form.pages || form.pages.length < 3) return "En az 3 sayfa seçilmelidir.";
        return null;
      case 12:
        return null;
      case 13:
        return null;
      case 14:
        return null;
      default:
        return null;
    }
  }

  // ─── Wizard Navigasyon ───────────────────────────────────────────────────────

  async function handleNext() {
    // Salt okunur modda doğrulama ve kaydetme yapma, sadece ileri git
    if (isCompleted) {
      setStep((s) => s + 1);
      return;
    }
    const err = validateStep(step);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError("");
    const result = await handleSave(false);
    if (!result.ok) {
      setStepError("Kaydetme hatası: " + result.error);
      return;
    }
    setStep((s) => s + 1);
  }

  function handleBack() {
    setStepError("");
    setStep((s) => Math.max(0, s - 1));
  }

  async function handleSubmit() {
    setStepError("");
    const result = await handleSave(true);
    if (!result.ok) {
      setStepError("Gönderme hatası: " + result.error);
      return;
    }
    setStep(16);
  }

  // ─── CSS Yardımcıları ────────────────────────────────────────────────────────

  const inputCls =
    "mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";
  const labelCls = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";
  const sectionCls =
    "space-y-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900";

  // (AI soru/cevap kaldırıldı)

  // ─── Domain ekleme ──────────────────────────────────────────────────────────

  function addDomain(raw) {
    const normalized = normalizeDomain(raw);
    if (!normalized) return;
    setRequestedDomains((p) => [...p, normalized]);
    setDomainInput("");
    if (!domainAvailability[normalized]) {
      checkDomainAvailability(normalized);
    }
  }

  function removeDomain(idx) {
    setRequestedDomains((p) => p.filter((_, i) => i !== idx));
  }

  // ─── Wizard Adım İçerikleri ───────────────────────────────────────────────────

  function renderStepContent() {
    switch (step) {
      // ADIM 1: Temel Bilgiler
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>
                  İşletme Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.business_name}
                  onChange={(e) => set("business_name", e.target.value)}
                  className={inputCls}
                  placeholder="ABC İşletmesi"
                />
              </div>
              <div>
                <label className={labelCls}>
                  Sektör <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.sector}
                  onChange={(e) => set("sector", e.target.value)}
                  className={inputCls}
                  placeholder="Çilingir, Restoran, Hukuk…"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>
                  Cep Telefonu <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={form.contact_phone}
                  onChange={(e) =>
                    set("contact_phone", formatPhone(e.target.value, "mobile"))
                  }
                  className={inputCls}
                  placeholder="05XX XXX XX XX"
                  maxLength={14}
                />
                <label className="mt-1.5 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <input
                    type="checkbox"
                    checked={form.contact_phone_has_whatsapp}
                    onChange={(e) => set("contact_phone_has_whatsapp", e.target.checked)}
                    className="rounded"
                  />
                  WhatsApp butonu siteye eklensin
                </label>
              </div>
              <div>
                <label className={labelCls}>Sabit Hat (opsiyonel)</label>
                <input
                  type="tel"
                  value={form.landline_phone}
                  onChange={(e) =>
                    set("landline_phone", formatPhone(e.target.value, "landline"))
                  }
                  className={inputCls}
                  placeholder="0XXX XXX XX XX"
                  maxLength={14}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>
                  E-posta <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className={inputCls}
                  placeholder="info@example.com"
                />
              </div>
              <div>
                <label className={labelCls}>Yetkili Telefonu (iç iletişim)</label>
                <input
                  type="tel"
                  value={form.authorized_person_phone}
                  onChange={(e) =>
                    set(
                      "authorized_person_phone",
                      formatPhone(
                        e.target.value,
                        isMobile(e.target.value) ? "mobile" : "landline"
                      )
                    )
                  }
                  className={inputCls}
                  placeholder="05XX XXX XX XX"
                  maxLength={14}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>
                Adres <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                className={`${inputCls} resize-none`}
                placeholder="Mahalle, Sokak, No, İlçe / İl"
              />
            </div>
            <div>
              <label className={labelCls}>Google Maps Linki (opsiyonel)</label>
              <input
                type="url"
                value={form.google_maps_link}
                onChange={(e) => set("google_maps_link", e.target.value)}
                className={inputCls}
                placeholder="https://maps.google.com/…"
              />
            </div>
          </div>
        );

      // ADIM 2: Çalışma Saatleri
      case 2:
        return (
          <div className="space-y-3">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Her gün için çalışma saatlerinizi ayarlayın. Kapalı olan günleri işaretleyin.
            </p>
            <WorkingHours
              value={form.working_hours}
              onChange={(v) => set("working_hours", v)}
            />
          </div>
        );

      // ADIM 3: Hizmetler
      case 3:
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Web sitenizde yer almasını istediğiniz tüm hizmetleri ekleyin.
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {[
                  "Kombi Bakımı", "Su Tesisatı", "Elektrik Tamiratı",
                  "Diş Temizliği", "İmplant", "Kanal Tedavisi",
                ].map((ex) => (
                  <span
                    key={ex}
                    className="rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                  >
                    {ex}
                  </span>
                ))}
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Bu örnekler gibi...
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={serviceInput.name}
                onChange={(e) => setServiceInput((p) => ({ ...p, name: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (!serviceInput.name.trim()) return;
                    setServices((p) => [...p, { ...serviceInput }]);
                    setServiceInput({ name: "", description: "" });
                  }
                }}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 sm:flex-1"
                placeholder="Hizmet adı"
              />
              <input
                type="text"
                value={serviceInput.description}
                onChange={(e) =>
                  setServiceInput((p) => ({ ...p, description: e.target.value }))
                }
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 sm:flex-1"
                placeholder="Kısa açıklama (opsiyonel)"
              />
              <button
                onClick={() => {
                  if (!serviceInput.name.trim()) return;
                  setServices((p) => [...p, { ...serviceInput }]);
                  setServiceInput({ name: "", description: "" });
                }}
                className="w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900 sm:w-auto sm:shrink-0"
              >
                + Ekle
              </button>
            </div>
            {services.length > 0 && (
              <ul className="space-y-1.5">
                {services.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700"
                  >
                    <span className="text-sm text-zinc-800 dark:text-zinc-200">
                      <strong>{s.name}</strong>
                      {s.description ? ` — ${s.description}` : ""}
                    </span>
                    <button
                      onClick={() => setServices((p) => p.filter((_, idx) => idx !== i))}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );

      // ADIM 4: Hizmet Bölgeleri
      case 4:
        return (
          <div className="space-y-4">
            <p className="text-sm text-zinc-500">
              En az <strong>1 hizmet bölgesi</strong> eklenmelidir.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={regionInput}
                onChange={(e) => setRegionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (!regionInput.trim()) return;
                    setRegions((p) => [...p, regionInput.trim()]);
                    setRegionInput("");
                  }
                }}
                className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                placeholder="İstanbul, Kadıköy…"
              />
              <button
                onClick={() => {
                  if (!regionInput.trim()) return;
                  setRegions((p) => [...p, regionInput.trim()]);
                  setRegionInput("");
                }}
                className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                + Ekle
              </button>
            </div>
            {regions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {regions.map((r, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1 text-xs dark:border-zinc-700"
                  >
                    {r}
                    <button
                      onClick={() => setRegions((p) => p.filter((_, idx) => idx !== i))}
                      className="text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        );

      // ADIM 5: İçerik
      case 5:
        return (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Slogan / Kısa Açıklama (opsiyonel)</label>
              <input
                type="text"
                value={form.slogan}
                onChange={(e) => set("slogan", e.target.value)}
                className={inputCls}
                placeholder="Güvenilir ve hızlı hizmet…"
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <label className={labelCls}>
                  Hakkımızda Metni <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  disabled={aiLoading.about}
                  onClick={() => handleAI("about")}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {aiLoading.about ? "Yazılıyor…" : "AI ile Yaz"}
                </button>
              </div>
              <textarea
                rows={6}
                value={form.about_text}
                onChange={(e) => set("about_text", e.target.value)}
                className={`${inputCls} resize-y`}
                placeholder="İşletmenizi kısaca anlatın…"
              />
            </div>
          </div>
        );

      // ADIM 6: Domain Adayları
      case 6:
        return (
          <div className="space-y-4">
            <p className="text-sm text-zinc-500">
              En az <strong>1 domain adayı</strong> girilmelidir.
            </p>
            <DomainInputRow
              domainInput={domainInput}
              setDomainInput={setDomainInput}
              onAdd={addDomain}
            />
            <DomainList
              domains={requestedDomains}
              availability={domainAvailability}
              onRemove={removeDomain}
            />
          </div>
        );

      // ADIM 7: Marka Kimliği (tümü opsiyonel)
      case 7:
        return (
          <div className="space-y-5">
            <p className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500 dark:bg-zinc-800">
              Bu adımdaki tüm alanlar opsiyoneldir, atlayabilirsiniz.
            </p>
            <div>
              <label className={labelCls}>Marka Dili</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {BRAND_TONES.map((t) => (
                  <label
                    key={t.value}
                    className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${form.brand_tone === t.value
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400"
                      }`}
                  >
                    <input
                      type="radio"
                      name="brand_tone"
                      value={t.value}
                      checked={form.brand_tone === t.value}
                      onChange={() => set("brand_tone", t.value)}
                      className="sr-only"
                    />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>Ana Hedef</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {MAIN_GOALS.map((g) => (
                  <label
                    key={g.value}
                    className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${form.main_goal === g.value
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400"
                      }`}
                  >
                    <input
                      type="radio"
                      name="main_goal"
                      value={g.value}
                      checked={form.main_goal === g.value}
                      onChange={() => set("main_goal", g.value)}
                      className="sr-only"
                    />
                    {g.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Rakip / Referans Site</label>
                <input
                  type="url"
                  value={form.competitor_website}
                  onChange={(e) => set("competitor_website", e.target.value)}
                  className={inputCls}
                  placeholder="https://rakip.com"
                />
              </div>
              <div>
                <label className={labelCls}>Ne Kadar Benzesin?</label>
                <div className="mt-2 flex gap-2">
                  {SIMILARITY_LEVELS.map((s) => (
                    <label
                      key={s.value}
                      className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${form.similarity_level === s.value
                        ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                        : "border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
                        }`}
                    >
                      <input
                        type="radio"
                        name="similarity_level"
                        value={s.value}
                        checked={form.similarity_level === s.value}
                        onChange={() => set("similarity_level", s.value)}
                        className="sr-only"
                      />
                      {s.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      // ADIM 8: Renk Paleti
      case 8:
        return (
          <div className="space-y-4">
            <p className="text-sm text-zinc-500">
              Bir renk paleti <strong>seçmek zorunludur</strong>. Hazır paletlerden seçebilir, elle girebilir veya AI ile üretebilirsiniz.
            </p>
            {form.color_palette && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 dark:border-emerald-700 dark:bg-emerald-950/40">
                <div className="flex items-center">
                  {["primary", "secondary", "accent", "background", "text"].map((k) => (
                    <div
                      key={k}
                      className="-ml-2 h-6 w-6 rounded-full border-2 border-white shadow-sm first:ml-0 dark:border-emerald-950"
                      style={{ background: form.color_palette[k] }}
                    />
                  ))}
                </div>
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  ✓ Renk paleti seçildi
                </span>
              </div>
            )}
            <ColorPalette
              value={form.color_palette}
              onChange={(v) => set("color_palette", v)}
              sector={form.sector}
              brandTone={form.brand_tone}
              mainGoal={form.main_goal}
              projectId={projectId}
              mode={form.color_palette_mode}
              aiPalettes={form.color_ai_palettes}
              onModeChange={(nextMode) => {
                set("color_palette_mode", nextMode);
                set("color_generate", nextMode === "ai");
              }}
              onAIGenerated={async (palettes) => {
                const defaultPalette = form.color_palette || palettes?.[0]?.colors || null;
                setForm((prev) => ({
                  ...prev,
                  color_palette_mode: "ai",
                  color_generate: true,
                  color_ai_palettes: palettes,
                  color_palette: prev.color_palette || defaultPalette,
                }));
                await persistColorPaletteFields({
                  color_palette_mode: "ai",
                  color_generate: true,
                  color_ai_palettes: palettes,
                  color_palette: defaultPalette,
                });
              }}
            />
          </div>
        );

      // ADIM 9: Logo
      case 9:
        return (
          <div className="space-y-4">
            <p className="text-sm text-zinc-500">
              Logo <strong>zorunludur</strong>. AI ile üretip birini seçebilir veya kendi logonuzu yükleyebilirsiniz.
            </p>
            <LogoSection
              logoUrl={form.logo_url}
              logoGenerate={form.logo_generate}
              logoAiUrls={form.logo_ai_urls}
              sector={form.sector}
              businessName={form.business_name}
              services={services}
              colorPalette={form.color_palette}
              projectId={projectId}
              onLogoChange={(url) => set("logo_url", url)}
              onAiGenerated={(urls) => {
                set("logo_ai_urls", urls);
                set("logo_generate", true);
              }}
            />
          </div>
        );

      // ADIM 10: Site Görselleri
      case 10:
        return (
          <div className="space-y-4">
            {/* Açıklama kartı */}
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Sitenizde yer almasını istediğiniz görselleri yükleyin.
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Dükkanınızın veya ofisinizin fotoğrafları, daha önce yaptığınız örnek işler,
                ürün görselleri ya da ekibinizle ilgili kareler olabilir. Bu görseller sitenizin
                görsel kalitesini doğrudan etkiler.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { emoji: "🏪", label: "Dükkan / Ofis" },
                  { emoji: "🔧", label: "Örnek İşler" },
                  { emoji: "📦", label: "Ürünler" },
                  { emoji: "👥", label: "Ekip Fotoğrafları" },
                  { emoji: "🖼️", label: "Vitrin / Sergi" },
                ].map(({ emoji, label }) => (
                  <span
                    key={label}
                    className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                  >
                    <span>{emoji}</span>
                    {label}
                  </span>
                ))}
              </div>
              <p className="mt-2.5 text-xs text-zinc-400 dark:text-zinc-500">
                Bu adım opsiyoneldir — isterseniz boş bırakabilirsiniz. (Maks. 20 görsel, her biri 3 MB)
              </p>
            </div>
            <div
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 p-6 text-center hover:border-zinc-400 dark:border-zinc-600 dark:hover:border-zinc-500"
              onClick={() => galleryInputRef.current?.click()}
            >
              <p className="text-sm text-zinc-500">Görselleri buraya sürükleyin veya tıklayın</p>
              <p className="mt-1 text-xs text-zinc-400">PNG, JPG, WEBP — maks. 3 MB her biri</p>
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleGalleryUpload}
              />
            </div>
            {form.gallery_images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {form.gallery_images.map((url, i) => (
                  <div
                    key={i}
                    className="group relative aspect-square overflow-hidden rounded-lg bg-zinc-100"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button
                      onClick={() =>
                        set(
                          "gallery_images",
                          form.gallery_images.filter((_, idx) => idx !== i)
                        )
                      }
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white opacity-0 group-hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      // ADIM 11: Sayfalar
      case 11:
        return (
          <div className="space-y-4">
            <p className="text-sm text-zinc-500">
              Sitenizde olmasını istediğiniz sayfaları seçin.{" "}
              <strong>En az 3 sayfa</strong> seçilmelidir.
            </p>
            <PageSelector
              value={form.pages}
              onChange={(v) => set("pages", v)}
            />
          </div>
        );

      // ADIM 12: Menü ve Ürünler
      case 12:
        return (
          <div className="space-y-4">
            <p className="text-sm text-zinc-500">
              Ürün veya menü kalemleri ekleyin.{" "}
              <span className="text-zinc-400">(Opsiyonel)</span>
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={menuInput.title}
                onChange={(e) => setMenuInput((p) => ({ ...p, title: e.target.value }))}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 sm:flex-1"
                placeholder="Başlık"
              />
              <input
                type="text"
                value={menuInput.description}
                onChange={(e) => setMenuInput((p) => ({ ...p, description: e.target.value }))}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 sm:flex-1"
                placeholder="Açıklama"
              />
              <button
                onClick={() => {
                  if (!menuInput.title.trim()) return;
                  setMenuItems((p) => [...p, { ...menuInput }]);
                  setMenuInput({ title: "", description: "" });
                }}
                className="w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900 sm:w-auto sm:shrink-0"
              >
                + Ekle
              </button>
            </div>
            {menuItems.length > 0 && (
              <ul className="space-y-1.5">
                {menuItems.map((m, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700"
                  >
                    <span className="text-sm">
                      <strong className="text-zinc-800 dark:text-zinc-200">{m.title}</strong>
                      {m.description && (
                        <span className="text-zinc-500"> — {m.description}</span>
                      )}
                    </span>
                    <button
                      onClick={() => setMenuItems((p) => p.filter((_, idx) => idx !== i))}
                      className="text-xs text-red-500"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );

      // ADIM 13: Sosyal Medya
      case 13:
        return (
          <div className="space-y-4">
            <p className="text-sm text-zinc-500">
              Sosyal medya hesaplarınızı ekleyin.{" "}
              <span className="text-zinc-400">(Opsiyonel)</span>
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/…" },
                { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/…" },
                { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/…" },
                { key: "other", label: "Diğer", placeholder: "https://…" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <input
                    type="url"
                    value={form.social_links?.[key] || ""}
                    onChange={(e) => setSocial(key, e.target.value)}
                    className={inputCls}
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>
          </div>
        );

      // ADIM 14: İstekleriniz
      case 14:
        return (
          <div className="space-y-5">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/40">
              <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">
                Site hakkında istekleriniz
              </p>
              <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-400">
                Sitede olmasını istediğiniz her şeyi buraya yazabilirsiniz. Örn: özel bölümler, kampanya alanları,
                farklı tasarım istekleri, içerik notları, iletişim/WhatsApp yönlendirmeleri vb.
              </p>
            </div>

            <div>
              <label className={labelCls}>Detaylı istekleriniz (opsiyonel)</label>
              <textarea
                rows={8}
                value={site_requests}
                onChange={(e) => setSiteRequests(e.target.value)}
                disabled={isCompleted}
                className={`${inputCls} resize-y`}
                placeholder="Tüm isteklerinizi madde madde yazın…"
              />
            </div>
          </div>
        );

      // ADIM 15: Özet / Gönder
      case 15:
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-950/40">
              <h3 className="font-semibold text-emerald-900 dark:text-emerald-200">
                Tüm adımları tamamladınız!
              </h3>
              <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">
                Bilgilerinizi göndermek için aşağıdaki butona tıklayın. Ekibimiz en kısa sürede
                sitenizi hazırlamaya başlayacaktır.
              </p>
            </div>
            <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-700 dark:bg-zinc-900">
              <div className="flex justify-between">
                <span className="text-zinc-500">İşletme Adı</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {form.business_name || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Sektör</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {form.sector || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Hizmetler</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {services.length} adet
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Hizmet Bölgeleri</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {regions.length} adet
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Domain Adayları</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {requestedDomains.join(", ") || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Renk Paleti</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {form.color_palette ? "✓ Seçildi" : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Logo</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {form.logo_url ? "✓ Yüklendi" : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Sayfalar</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {form.pages?.length || 0} sayfa
                </span>
              </div>
            </div>

            {isAdmin && (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-950/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200">
                      AI Proje Prompt&apos;u
                    </p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400">
                      AI editör için site yapım prompt&apos;u oluşturun.
                    </p>
                  </div>
                  <button
                    onClick={handlePrompt}
                    disabled={aiLoading.prompt}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {aiLoading.prompt ? "Üretiliyor…" : "Prompt Oluştur"}
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  }

  // ─── WIZARD RENDER ─────────────────────────────────────────────────────────

  if (wizard) {
    // Tebrik sayfası (adım 16)
    if (step === 16) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl dark:bg-emerald-900">
            🎉
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Tebrikler!</h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Kurulum formunu başarıyla doldurdunuz. Ekibimiz en kısa sürede sitenizi yapıp size
            bilgi verecektir.
          </p>
          <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-4 dark:border-emerald-800 dark:bg-emerald-950/40">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              ✓ Form başarıyla gönderildi
            </p>
          </div>
        </div>
      );
    }

    // Karşılama ekranı
    if (step === 0) {
      const STATUS_MAP = {
        pending: { label: "Doldurulmadı", bg: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400" },
        in_review: { label: "İnceleniyor", bg: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" },
        in_progress: { label: "Yapım Aşamasında", bg: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" },
        completed: { label: "Tamamlandı", bg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" },
      };
      const statusInfo = STATUS_MAP[formStatus] || STATUS_MAP.pending;

      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 text-2xl text-white dark:bg-zinc-100 dark:text-zinc-900">
            📋
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Kurulum Formu</h1>
          {form.business_name && (
            <p className="mt-1 text-base font-medium text-zinc-600 dark:text-zinc-400">
              {form.business_name}
            </p>
          )}

          {/* Durum rozeti */}
          <div className="mt-4">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.bg}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
              {statusInfo.label}
            </span>
          </div>

          {isCompleted ? (
            <>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                Kurulum formunu doldurdunuz. Aşağıdan girdiğiniz bilgileri inceleyebilirsiniz.
              </p>
              <button
                onClick={() => setStep(1)}
                className="mt-6 rounded-xl border border-zinc-300 bg-white px-8 py-3 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                Formu Görüntüle →
              </button>
            </>
          ) : (
            <>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                Bu formu doldurarak sitenizin yapımı için gerekli bilgileri ekibimizle paylaşacaksınız.
                Form <strong>{TOTAL_STEPS} adımdan</strong> oluşmaktadır, her adımda bilgileriniz otomatik kaydedilir.
              </p>
              <button
                onClick={() => setStep(1)}
                className="mt-8 rounded-xl bg-zinc-900 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Kuruluma Başla →
              </button>
            </>
          )}
        </div>
      );
    }

    // Wizard adımları (1–14)
    const progress = step >= TOTAL_STEPS ? 100 : ((step - 1) / TOTAL_STEPS) * 100;
    const currentStepTitle =
      step <= TOTAL_STEPS ? WIZARD_STEPS[step - 1]?.title : "Özet";

    return (
      <div className="pb-28 pt-0">
        {/* ─── Başlık + İlerleme (fixed top) ─── */}
        <div className="fixed left-0 right-0 top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
          <div className="mx-auto max-w-2xl px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Geri ikon butonu */}
              <button
                onClick={handleBack}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-200"
                title="Geri"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* İlerleme çubuğu */}
              <div className="flex-1">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {step <= TOTAL_STEPS ? `Adım ${step} / ${TOTAL_STEPS}` : "Tamamlandı"}
                  </span>
                  <span className="text-xs text-zinc-400">{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <div
                    className="h-full rounded-full bg-zinc-900 transition-all duration-300 dark:bg-zinc-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
            <h2 className="mt-2 text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {currentStepTitle}
            </h2>
          </div>
        </div>

        {/* ─── Adım İçeriği (üst header yüksekliği kadar boşluk) ─── */}
        <div className="mx-auto w-full max-w-2xl px-4 pb-4 pt-28">
          {renderStepContent()}
        </div>

        {/* ─── Alt Navigasyon (fixed bottom) ─── */}
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95">
          <div className="mx-auto max-w-2xl px-4 py-3">
            {stepError && (
              <p className="mb-2 rounded-lg bg-orange-50 px-3 py-2 text-sm font-medium text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                ⚠ {stepError}
              </p>
            )}
            {step <= TOTAL_STEPS ? (
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={handleBack}
                  className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  ← Geri
                </button>
                <button
                  onClick={handleNext}
                  disabled={saving}
                  className="rounded-lg bg-zinc-900 px-8 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  {isCompleted ? "İleri →" : saving ? "Kaydediliyor…" : "İlerle →"}
                </button>
              </div>
            ) : (
              /* Son adım: isCompleted ise sadece geri butonu, gönder butonu gizle */
              isCompleted ? (
                <div className="flex justify-start">
                  <button
                    onClick={handleBack}
                    className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    ← Geri
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  {saveMsg && (
                    <span
                      className={`text-sm font-medium ${saveMsg.startsWith("Hata") ? "text-red-600" : "text-emerald-600"}`}
                    >
                      {saveMsg}
                    </span>
                  )}
                  <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    {saving ? "Gönderiliyor…" : "Kaydet ve Gönder ✓"}
                  </button>
                </div>
              )
            )}
          </div>
        </div>

        {promptModal && (
          <PromptModal text={promptText} onClose={() => setPromptModal(false)} />
        )}
      </div>
    );
  }

  // ─── DÜZLÜM FORMU (wizard=false, CRM admin için) ──────────────────────────

  return (
    <div className="space-y-4">

      {/* ADMIN: PROMPT BUTONU */}
      {isAdmin && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-950/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200">
                AI Proje Prompt&apos;u
              </p>
            </div>
            <button
              onClick={handlePrompt}
              disabled={aiLoading.prompt}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {aiLoading.prompt ? "Üretiliyor…" : "Prompt Oluştur"}
            </button>
          </div>
        </div>
      )}

      {/* TEMEL BİLGİLER */}
      <section className={sectionCls}>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Temel Bilgiler</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>İşletme Adı</label>
            <input
              type="text"
              value={form.business_name}
              onChange={(e) => set("business_name", e.target.value)}
              className={inputCls}
              placeholder="ABC İşletmesi"
            />
          </div>
          <div>
            <label className={labelCls}>Sektör</label>
            <input
              type="text"
              value={form.sector}
              onChange={(e) => set("sector", e.target.value)}
              className={inputCls}
              placeholder="Çilingir, Restoran, Hukuk…"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Cep Telefonu</label>
            <input
              type="tel"
              value={form.contact_phone}
              onChange={(e) => set("contact_phone", formatPhone(e.target.value, "mobile"))}
              className={inputCls}
              placeholder="05XX XXX XX XX"
              maxLength={14}
            />
            <label className="mt-1.5 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <input
                type="checkbox"
                checked={form.contact_phone_has_whatsapp}
                onChange={(e) => set("contact_phone_has_whatsapp", e.target.checked)}
                className="rounded"
              />
              WhatsApp butonu siteye eklensin
            </label>
          </div>
          <div>
            <label className={labelCls}>Sabit Hat (opsiyonel)</label>
            <input
              type="tel"
              value={form.landline_phone}
              onChange={(e) => set("landline_phone", formatPhone(e.target.value, "landline"))}
              className={inputCls}
              placeholder="0XXX XXX XX XX"
              maxLength={14}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>E-posta</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className={inputCls}
              placeholder="info@example.com"
            />
          </div>
          <div>
            <label className={labelCls}>Yetkili Telefonu (iç iletişim)</label>
            <input
              type="tel"
              value={form.authorized_person_phone}
              onChange={(e) =>
                set(
                  "authorized_person_phone",
                  formatPhone(e.target.value, isMobile(e.target.value) ? "mobile" : "landline")
                )
              }
              className={inputCls}
              placeholder="05XX XXX XX XX"
              maxLength={14}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Adres</label>
          <textarea
            rows={2}
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            className={`${inputCls} resize-none`}
            placeholder="Mahalle, Sokak, No, İlçe / İl"
          />
        </div>
        <div>
          <label className={labelCls}>Google Maps Linki</label>
          <input
            type="url"
            value={form.google_maps_link}
            onChange={(e) => set("google_maps_link", e.target.value)}
            className={inputCls}
            placeholder="https://maps.google.com/…"
          />
        </div>
      </section>

      {/* ÇALIŞMA SAATLERİ */}
      <section className={sectionCls}>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Çalışma Saatleri</h3>
        <WorkingHours value={form.working_hours} onChange={(v) => set("working_hours", v)} />
      </section>

      {/* HİZMETLER */}
      <section className={sectionCls}>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Hizmetler</h3>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={serviceInput.name}
            onChange={(e) => setServiceInput((p) => ({ ...p, name: e.target.value }))}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 sm:flex-1"
            placeholder="Hizmet adı"
          />
          <input
            type="text"
            value={serviceInput.description}
            onChange={(e) => setServiceInput((p) => ({ ...p, description: e.target.value }))}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 sm:flex-1"
            placeholder="Kısa açıklama (opsiyonel)"
          />
          <button
            onClick={() => {
              if (!serviceInput.name.trim()) return;
              setServices((p) => [...p, { ...serviceInput }]);
              setServiceInput({ name: "", description: "" });
            }}
            className="w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900 sm:w-auto sm:shrink-0"
          >
            + Ekle
          </button>
        </div>
        {services.length > 0 && (
          <ul className="space-y-1.5">
            {services.map((s, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700"
              >
                <span className="text-sm text-zinc-800 dark:text-zinc-200">
                  <strong>{s.name}</strong>
                  {s.description ? ` — ${s.description}` : ""}
                </span>
                <button
                  onClick={() => setServices((p) => p.filter((_, idx) => idx !== i))}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* HİZMET BÖLGELERİ */}
      <section className={sectionCls}>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Hizmet Bölgeleri</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={regionInput}
            onChange={(e) => setRegionInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (!regionInput.trim()) return;
                setRegions((p) => [...p, regionInput.trim()]);
                setRegionInput("");
              }
            }}
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            placeholder="İstanbul, Kadıköy…"
          />
          <button
            onClick={() => {
              if (!regionInput.trim()) return;
              setRegions((p) => [...p, regionInput.trim()]);
              setRegionInput("");
            }}
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            + Ekle
          </button>
        </div>
        {regions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {regions.map((r, i) => (
              <span
                key={i}
                className="flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1 text-xs dark:border-zinc-700"
              >
                {r}
                <button
                  onClick={() => setRegions((p) => p.filter((_, idx) => idx !== i))}
                  className="text-red-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* MENÜ / ÜRÜNLER */}
      <section className={sectionCls}>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Menü ve Ürünler</h3>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={menuInput.title}
            onChange={(e) => setMenuInput((p) => ({ ...p, title: e.target.value }))}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 sm:flex-1"
            placeholder="Başlık"
          />
          <input
            type="text"
            value={menuInput.description}
            onChange={(e) => setMenuInput((p) => ({ ...p, description: e.target.value }))}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 sm:flex-1"
            placeholder="Açıklama"
          />
          <button
            onClick={() => {
              if (!menuInput.title.trim()) return;
              setMenuItems((p) => [...p, { ...menuInput }]);
              setMenuInput({ title: "", description: "" });
            }}
            className="w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900 sm:w-auto sm:shrink-0"
          >
            + Ekle
          </button>
        </div>
        {menuItems.length > 0 && (
          <ul className="space-y-1.5">
            {menuItems.map((m, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700"
              >
                <span className="text-sm">
                  <strong className="text-zinc-800 dark:text-zinc-200">{m.title}</strong>
                  {m.description ? (
                    <span className="text-zinc-500"> — {m.description}</span>
                  ) : null}
                </span>
                <button
                  onClick={() => setMenuItems((p) => p.filter((_, idx) => idx !== i))}
                  className="text-xs text-red-500"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* SOSYAL MEDYA */}
      <section className={sectionCls}>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Sosyal Medya</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/…" },
            { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/…" },
            { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/…" },
            { key: "other", label: "Diğer", placeholder: "https://…" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className={labelCls}>{label}</label>
              <input
                type="url"
                value={form.social_links?.[key] || ""}
                onChange={(e) => setSocial(key, e.target.value)}
                className={inputCls}
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ALAN ADI TALEPLERI */}
      <section className={sectionCls}>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">İstenen Domain Adayları</h3>
        {/* <p className="text-xs text-zinc-500">
          Türkçe karakterler otomatik dönüştürülür. Eklenen her domain uygunluk açısından kontrol
          edilir.
        </p> */}
        <DomainInputRow
          domainInput={domainInput}
          setDomainInput={setDomainInput}
          onAdd={addDomain}
        />
        <DomainList
          domains={requestedDomains}
          availability={domainAvailability}
          onRemove={removeDomain}
        />
      </section>

      {/* RENK PALETİ */}
      <section className={sectionCls}>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Renk Paleti</h3>
        <ColorPalette
          value={form.color_palette}
          onChange={(v) => set("color_palette", v)}
          sector={form.sector}
          brandTone={form.brand_tone}
          mainGoal={form.main_goal}
          projectId={projectId}
          mode={form.color_palette_mode}
          aiPalettes={form.color_ai_palettes}
          onModeChange={(nextMode) => {
            set("color_palette_mode", nextMode);
            set("color_generate", nextMode === "ai");
          }}
          onAIGenerated={async (palettes) => {
            const defaultPalette = form.color_palette || palettes?.[0]?.colors || null;
            setForm((prev) => ({
              ...prev,
              color_palette_mode: "ai",
              color_generate: true,
              color_ai_palettes: palettes,
              color_palette: prev.color_palette || defaultPalette,
            }));
            await persistColorPaletteFields({
              color_palette_mode: "ai",
              color_generate: true,
              color_ai_palettes: palettes,
              color_palette: defaultPalette,
            });
          }}
        />
      </section>

      {/* MARKA KİMLİĞİ */}
      <section className={sectionCls}>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Marka Kimliği</h3>
        <div>
          <label className={labelCls}>Marka Dili</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {BRAND_TONES.map((t) => (
              <label
                key={t.value}
                className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${form.brand_tone === t.value
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                  : "border-zinc-200 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400"
                  }`}
              >
                <input
                  type="radio"
                  name="brand_tone"
                  value={t.value}
                  checked={form.brand_tone === t.value}
                  onChange={() => set("brand_tone", t.value)}
                  className="sr-only"
                />
                {t.label}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className={labelCls}>Ana Hedef</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {MAIN_GOALS.map((g) => (
              <label
                key={g.value}
                className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${form.main_goal === g.value
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                  : "border-zinc-200 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400"
                  }`}
              >
                <input
                  type="radio"
                  name="main_goal"
                  value={g.value}
                  checked={form.main_goal === g.value}
                  onChange={() => set("main_goal", g.value)}
                  className="sr-only"
                />
                {g.label}
              </label>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Rakip / Referans Site</label>
            <input
              type="url"
              value={form.competitor_website}
              onChange={(e) => set("competitor_website", e.target.value)}
              className={inputCls}
              placeholder="https://rakip.com"
            />
          </div>
          <div>
            <label className={labelCls}>Ne Kadar Benzesin?</label>
            <div className="mt-2 flex gap-2">
              {SIMILARITY_LEVELS.map((s) => (
                <label
                  key={s.value}
                  className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${form.similarity_level === s.value
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
                    }`}
                >
                  <input
                    type="radio"
                    name="similarity_level"
                    value={s.value}
                    checked={form.similarity_level === s.value}
                    onChange={() => set("similarity_level", s.value)}
                    className="sr-only"
                  />
                  {s.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HAKKIMIZDA & SLOGAN */}
      <section className={sectionCls}>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">İçerik</h3>
        <div>
          <label className={labelCls}>Slogan / Kısa Açıklama</label>
          <input
            type="text"
            value={form.slogan}
            onChange={(e) => set("slogan", e.target.value)}
            className={inputCls}
            placeholder="Güvenilir ve hızlı hizmet…"
          />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <label className={labelCls}>Hakkımızda Metni</label>
            <button
              type="button"
              disabled={aiLoading.about}
              onClick={() => handleAI("about")}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {aiLoading.about ? "Yazılıyor…" : "AI ile Yaz"}
            </button>
          </div>
          <textarea
            rows={5}
            value={form.about_text}
            onChange={(e) => set("about_text", e.target.value)}
            className={`${inputCls} resize-y`}
            placeholder="İşletmenizi kısaca anlatın…"
          />
        </div>
      </section>

      {/* SAYFALAR */}
      <section className={sectionCls}>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Sitede Olacak Sayfalar</h3>
        <PageSelector value={form.pages} onChange={(v) => set("pages", v)} />
      </section>

      {/* LOGO */}
      <section className={sectionCls}>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Logo</h3>
        <LogoSection
          logoUrl={form.logo_url}
          logoGenerate={form.logo_generate}
          logoAiUrls={form.logo_ai_urls}
          sector={form.sector}
          businessName={form.business_name}
          services={services}
          colorPalette={form.color_palette}
          projectId={projectId}
          onLogoChange={(url) => set("logo_url", url)}
          onAiGenerated={(urls) => {
            set("logo_ai_urls", urls);
            set("logo_generate", true);
          }}
        />
      </section>

      {/* GALERİ */}
      <section className={sectionCls}>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Site Görselleri</h3>
        {/* Açıklama kartı */}
        <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Sitenizde yer almasını istediğiniz görselleri yükleyin.
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Dükkanınızın veya ofisinizin fotoğrafları, daha önce yaptığınız örnek işler,
            ürün görselleri ya da ekibinizle ilgili kareler olabilir.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { emoji: "🏪", label: "Dükkan / Ofis" },
              { emoji: "🔧", label: "Örnek İşler" },
              { emoji: "📦", label: "Ürünler" },
              { emoji: "👥", label: "Ekip Fotoğrafları" },
              { emoji: "🖼️", label: "Vitrin / Sergi" },
            ].map(({ emoji, label }) => (
              <span
                key={label}
                className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
              >
                <span>{emoji}</span>
                {label}
              </span>
            ))}
          </div>
          <p className="mt-2.5 text-xs text-zinc-400 dark:text-zinc-500">
            Opsiyonel — maks. 20 görsel, her biri 3 MB
          </p>
        </div>
        <div
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 p-6 text-center hover:border-zinc-400 dark:border-zinc-600 dark:hover:border-zinc-500"
          onClick={() => galleryInputRef.current?.click()}
        >
          <p className="text-sm text-zinc-500">Görselleri buraya sürükleyin veya tıklayın</p>
          <p className="mt-1 text-xs text-zinc-400">PNG, JPG, WEBP — maks. 3 MB her biri</p>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleGalleryUpload}
          />
        </div>
        {form.gallery_images.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {form.gallery_images.map((url, i) => (
              <div key={i} className="group relative aspect-square overflow-hidden rounded-lg bg-zinc-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={() =>
                    set("gallery_images", form.gallery_images.filter((_, idx) => idx !== i))
                  }
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white opacity-0 group-hover:opacity-100"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Kaydet butonları */}
      <div className="sticky bottom-0 left-0 right-0 z-20 border-t border-zinc-200 bg-white/95 py-3 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95">
        <div className="flex items-center gap-3">
          {saveMsg && (
            <span
              className={`text-sm font-medium ${saveMsg.startsWith("Hata") ? "text-red-600" : "text-emerald-600"}`}
            >
              {saveMsg}
            </span>
          )}
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </button>
            <button
              onClick={() => setConfirmModal(true)}
              disabled={saving}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Kaydet ve Gönder
            </button>
          </div>
        </div>
      </div>

      {/* Kaydet ve Gönder onay modal */}
      {confirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setConfirmModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Kurulum Formunu Gönder
            </h3>
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
              Formu kaydedip site yapımına göndermek istediğinize emin misiniz?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmModal(false)}
                className="flex-1 rounded-lg border border-zinc-200 py-2 text-sm font-medium dark:border-zinc-700"
              >
                İptal
              </button>
              <button
                onClick={async () => {
                  setConfirmModal(false);
                  await handleSave(true);
                }}
                className="flex-1 rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                Evet, Gönder
              </button>
            </div>
          </div>
        </div>
      )}

      {promptModal && (
        <PromptModal text={promptText} onClose={() => setPromptModal(false)} />
      )}
    </div>
  );
}
