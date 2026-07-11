"use client";

import { useState, useEffect, useCallback, useMemo, Fragment } from "react";

const INPUT_CLS =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

const INTENT_COLORS = {
  Local: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  Commercial: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  Emergency: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  Informational: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  Transactional: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  Navigational: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
};

function IntentBadge({ intent }) {
  const cls = INTENT_COLORS[intent] || INTENT_COLORS.Informational;
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${cls}`}>
      {intent || "—"}
    </span>
  );
}

function buildCandidateTree(candidates, filterSource, filterStructure) {
  const childrenByParent = {};

  for (const c of candidates) {
    if (!c.parent_id) continue;
    if (!childrenByParent[c.parent_id]) childrenByParent[c.parent_id] = [];
    childrenByParent[c.parent_id].push(c);
  }

  for (const pid of Object.keys(childrenByParent)) {
    childrenByParent[pid].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }

  function allChildren(parentId) {
    return childrenByParent[parentId] || [];
  }

  function visibleChildren(parentId) {
    const kids = allChildren(parentId);
    if (!filterSource) return kids;
    return kids.filter((c) => c.source === filterSource);
  }

  function rootVisible(root) {
    const totalChildCount = allChildren(root.id).length;

    if (filterStructure === "with_children" && totalChildCount === 0) return false;
    if (filterStructure === "without_children" && totalChildCount > 0) return false;

    if (!filterSource) return true;
    if (root.source === filterSource) return true;
    return visibleChildren(root.id).length > 0;
  }

  const visibleRoots = candidates.filter((c) => !c.parent_id).filter(rootVisible);

  return { childrenByParent, visibleRoots, visibleChildren };
}

function rowClass(selected, isChild) {
  const base = "cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50";
  const sel = selected ? "bg-emerald-50/60 dark:bg-emerald-950/20" : "";
  const child = isChild ? "bg-zinc-50/80 dark:bg-zinc-900/40" : "";
  return `${base} ${sel} ${child}`.trim();
}

export default function KeywordExplorerTab({ projectId }) {
  const [groups, setGroups] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [projectKeywords, setProjectKeywords] = useState([]);
  const [seoSettings, setSeoSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [itemInputs, setItemInputs] = useState({});
  const [locationCities, setLocationCities] = useState("bursa, ankara, izmir");
  const [locationDistricts, setLocationDistricts] = useState("nilüfer, osmangazi, kestel");
  const [filterSource, setFilterSource] = useState("");
  const [filterStructure, setFilterStructure] = useState("");
  const [expandingId, setExpandingId] = useState(null);

  const showMsg = (text, isError = false) => {
    setMsg(text);
    setTimeout(() => setMsg(""), isError ? 5000 : 3500);
  };

  const loadAll = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const [gRes, cRes, pRes, sRes] = await Promise.all([
        fetch(`/api/keywords/groups?project_id=${projectId}`),
        fetch(`/api/keywords/candidates?project_id=${projectId}`),
        fetch(`/api/keywords/project-keywords?project_id=${projectId}`),
        fetch(`/api/seo-settings/${projectId}`),
      ]);
      const [g, c, p, s] = await Promise.all([
        gRes.json(),
        cRes.json(),
        pRes.json(),
        sRes.json(),
      ]);
      if (gRes.ok) setGroups(g);
      if (cRes.ok) setCandidates(c);
      if (pRes.ok) setProjectKeywords(p);
      if (sRes.ok) setSeoSettings(s);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function runGenerate(action, extra = {}) {
    setBusy(action);
    setMsg("");
    try {
      const res = await fetch("/api/keywords/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "İşlem başarısız");
      showMsg(
        `Tamamlandı: ${data.inserted ?? data.clusters_created ?? 0} kayıt${data.total ? ` / ${data.total} aday` : ""}`
      );
      await loadAll({ silent: true });
    } catch (e) {
      showMsg(e.message, true);
    } finally {
      setBusy("");
    }
  }

  async function handleAddGroup(e) {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const res = await fetch("/api/keywords/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, name: newGroupName.trim() }),
    });
    const data = await res.json();
    if (!res.ok) return showMsg(data.error, true);
    setNewGroupName("");
    setGroups((prev) => [...prev, data]);
  }

  async function handleDeleteGroup(id) {
    if (!confirm("Grubu silmek istiyor musunuz?")) return;
    const res = await fetch(`/api/keywords/groups/${id}`, { method: "DELETE" });
    if (res.ok) setGroups((prev) => prev.filter((g) => g.id !== id));
  }

  async function handleAddItem(groupId) {
    const value = itemInputs[groupId]?.trim();
    if (!value) return;
    const res = await fetch(`/api/keywords/groups/${groupId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    const data = await res.json();
    if (!res.ok) return showMsg(data.error, true);
    setItemInputs((p) => ({ ...p, [groupId]: "" }));
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, keyword_group_items: [...(g.keyword_group_items || []), data] }
          : g
      )
    );
  }

  async function handleDeleteItem(groupId, itemId) {
    const res = await fetch(`/api/keywords/groups/${groupId}/items?item_id=${itemId}`, {
      method: "DELETE",
    });
    if (!res.ok) return;
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
            ...g,
            keyword_group_items: (g.keyword_group_items || []).filter((i) => i.id !== itemId),
          }
          : g
      )
    );
  }

  function toggleParentWithChildren(parentRow) {
    const nextSelected = !parentRow.selected;
    const childIds = candidates
      .filter((c) => c.parent_id === parentRow.id)
      .map((c) => c.id);
    setSelection([parentRow.id, ...childIds], nextSelected);
  }

  async function setSelection(ids, selected, all = false) {
    const previous = candidates;

    setCandidates((current) => {
      if (all) {
        return current.map((c) => ({ ...c, selected }));
      }
      const idSet = new Set(ids);
      return current.map((c) => (idSet.has(c.id) ? { ...c, selected } : c));
    });

    const res = await fetch("/api/keywords/candidates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, ids, selected, all }),
    });

    if (!res.ok) {
      setCandidates(previous);
      showMsg("Seçim güncellenemedi", true);
    }
  }

  async function handlePromote() {
    setBusy("promote");
    const res = await fetch("/api/keywords/promote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, only_selected: true }),
    });
    const data = await res.json();
    setBusy("");
    if (!res.ok) return showMsg(data.error, true);
    const parts = [];
    if (data.promoted) parts.push(`${data.promoted} eklendi`);
    if (data.removed) parts.push(`${data.removed} kaldırıldı`);
    showMsg(
      parts.length
        ? `Proje listesi güncellendi: ${parts.join(", ")} (toplam ${data.total ?? "—"})`
        : data.message || "Proje listesi güncel"
    );
    await loadAll({ silent: true });
  }

  async function handleExpandCandidate(candidateId, e) {
    e.stopPropagation();
    setExpandingId(candidateId);
    try {
      const res = await fetch("/api/keywords/candidates/expand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, candidate_id: candidateId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Genişletme başarısız");

      const added = (data.inserted || 0) + (data.attached || 0);
      if (added === 0) {
        if ((data.suggestions_found || 0) === 0) {
          showMsg(
            "Google öneri dönmedi. KEYWORD_AUTOCOMPLETE_DEBUG=1 ile sunucu loglarına bakın.",
            true
          );
        } else {
          showMsg(
            `${data.suggestions_found} öneri bulundu; ${data.already_under_parent || 0} zaten bu satırın altında.`,
            true
          );
        }
      } else {
        const parts = [];
        if (data.inserted) parts.push(`${data.inserted} yeni`);
        if (data.attached) parts.push(`${data.attached} listeden bağlandı`);
        showMsg(
          `Alt keyword: ${parts.join(", ")} (${data.suggestions_found} Google önerisi tarandı)`
        );
      }

      await loadAll({ silent: true });
    } catch (err) {
      showMsg(err.message, true);
    } finally {
      setExpandingId(null);
    }
  }

  async function handleDeleteCandidate(id, e) {
    e.stopPropagation();
    const res = await fetch(`/api/keywords/candidates/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      return showMsg(data.error || "Silinemedi", true);
    }
    setCandidates((prev) =>
      prev.filter((c) => c.id !== id && c.parent_id !== id)
    );
  }

  async function saveSeoSettings() {
    const res = await fetch(`/api/seo-settings/${projectId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(seoSettings),
    });
    if (res.ok) showMsg("SEO ayarları kaydedildi");
    else showMsg("Kayıt hatası", true);
  }

  const { visibleRoots, visibleChildren } = useMemo(
    () => buildCandidateTree(candidates, filterSource, filterStructure),
    [candidates, filterSource, filterStructure]
  );

  const selectedCount = candidates.filter((c) => c.selected).length;
  const childCount = candidates.filter((c) => c.parent_id).length;

  if (loading) {
    return <div className="py-12 text-center text-sm text-zinc-400">Keyword Explorer yükleniyor…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Keyword Explorer</h2>
          <p className="text-sm text-zinc-500">
            Local SEO keyword keşfi: gruplar, kombinasyonlar, Google autocomplete, AI ve aday yönetimi.
          </p>
        </div>
        {msg && (
          <p className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {msg}
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Keyword Groups */}
        <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">1. Keyword Grupları</h3>
          <p className="text-xs text-zinc-500">
            Her gruptan bir terim seçilerek tüm kombinasyonlar üretilir (ör. hizmet × şehir × intent).
          </p>

          <form onSubmit={handleAddGroup} className="flex gap-2">
            <input
              className={INPUT_CLS}
              placeholder="Grup adı (Ana Hizmet, Lokasyon…)"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              + Grup
            </button>
          </form>

          {groups.length === 0 ? (
            <p className="text-sm text-zinc-400">Henüz grup yok. Örnek: Ana Hizmet, Lokasyon, Intent.</p>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="rounded-lg border border-zinc-100 p-3 dark:border-zinc-800"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {group.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteGroup(group.id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Sil
                    </button>
                  </div>
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {(group.keyword_group_items || []).map((item) => (
                      <span
                        key={item.id}
                        className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800"
                      >
                        {item.value}
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(group.id, item.id)}
                          className="text-zinc-400 hover:text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      className={`${INPUT_CLS} text-xs`}
                      placeholder="Terim ekle"
                      value={itemInputs[group.id] || ""}
                      onChange={(e) =>
                        setItemInputs((p) => ({ ...p, [group.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddItem(group.id);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddItem(group.id)}
                      className="shrink-0 rounded-lg border border-zinc-200 px-2 text-xs dark:border-zinc-600"
                    >
                      Ekle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            disabled={!!busy || groups.length === 0}
            onClick={() => runGenerate("combinations")}
            className="w-full rounded-lg border border-zinc-300 py-2 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
          >
            {busy === "combinations" ? "Üretiliyor…" : "Kombinasyonları Üret → Adaylar"}
          </button>
        </section>

        {/* Üretim araçları */}
        <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">2. Keşif Araçları</h3>

          <p className="text-xs text-zinc-500">
            Google Autocomplete: aday satırının üzerine gelin → satır sonundaki araçları kullanın (a–z
            long tail).
          </p>

          <div className="grid gap-2 sm:grid-cols-2">
            <ActionBtn
              label="AI Keyword Genişletme"
              hint="ChatGPT"
              busy={busy === "ai_expand"}
              onClick={() => runGenerate("ai_expand")}
            />
            <ActionBtn
              label="Local SEO Goldmine"
              hint="AI fırsatlar"
              busy={busy === "ai_goldmine"}
              onClick={() => runGenerate("ai_goldmine")}
            />
            <ActionBtn
              label="AI Cluster"
              hint="Kayıtlı KW"
              busy={busy === "ai_cluster"}
              onClick={() => runGenerate("ai_cluster")}
            />
          </div>

          <div className="space-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Lokasyon üretici</p>
            <input
              className={INPUT_CLS}
              value={locationCities}
              onChange={(e) => setLocationCities(e.target.value)}
              placeholder="Şehirler (virgülle)"
            />
            <input
              className={INPUT_CLS}
              value={locationDistricts}
              onChange={(e) => setLocationDistricts(e.target.value)}
              placeholder="İlçeler (virgülle)"
            />
            <button
              type="button"
              disabled={!!busy}
              onClick={() =>
                runGenerate("locations", {
                  cities: locationCities.split(",").map((s) => s.trim()),
                  districts: locationDistricts.split(",").map((s) => s.trim()),
                })
              }
              className="w-full rounded-lg bg-zinc-900 py-2 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {busy === "locations" ? "Üretiliyor…" : "Lokasyon Keywordleri Üret"}
            </button>
          </div>

          {seoSettings && (
            <div className="space-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">SEO ayarları</p>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={seoSettings.auto_detect_intent}
                  onChange={(e) =>
                    setSeoSettings((s) => ({ ...s, auto_detect_intent: e.target.checked }))
                  }
                />
                Otomatik intent algılama
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={seoSettings.auto_generate_keywords}
                  onChange={(e) =>
                    setSeoSettings((s) => ({ ...s, auto_generate_keywords: e.target.checked }))
                  }
                />
                Otomatik keyword üretimi
              </label>
              <button
                type="button"
                onClick={saveSeoSettings}
                className="text-xs text-zinc-500 underline hover:text-zinc-800"
              >
                Ayarları kaydet
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Candidates table */}
      <section className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            3. Keyword Adayları ({visibleRoots.length} ana
            {childCount > 0 ? `, ${childCount} alt` : ""} · {selectedCount} seçili)
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="rounded-lg border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-800"
              aria-label="Kaynak filtresi"
            >
              <option value="">Tüm kaynaklar</option>
              <option value="combinations">Kombinasyon</option>
              <option value="google_autocomplete">Autocomplete (toplu)</option>
              <option value="google_autocomplete_expand">Autocomplete (satır altı)</option>
              <option value="locations">Lokasyon</option>
              <option value="ai_expand">AI Genişletme</option>
              <option value="ai_goldmine">AI Goldmine</option>
            </select>
            <select
              value={filterStructure}
              onChange={(e) => setFilterStructure(e.target.value)}
              className="rounded-lg border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-800"
              aria-label="Liste filtresi"
            >
              <option value="">Tüm ana adaylar</option>
              <option value="with_children">Alt keyword olanlar</option>
              <option value="without_children">Alt keyword olmayanlar</option>
            </select>
            <button
              type="button"
              onClick={() => setSelection([], true, true)}
              className="text-xs text-zinc-600 hover:underline"
            >
              Tümünü seç
            </button>
            <button
              type="button"
              onClick={() => setSelection([], false, true)}
              className="text-xs text-zinc-600 hover:underline"
            >
              Seçimi kaldır
            </button>
            <button
              type="button"
              disabled={!!busy || selectedCount === 0}
              onClick={handlePromote}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {busy === "promote" ? "Kaydediliyor…" : `Projeye Kaydet (${selectedCount})`}
            </button>
          </div>
        </div>

        {visibleRoots.length === 0 ? (
          <p className="p-8 text-center text-sm text-zinc-400">
            Henüz aday yok. Grupları doldurup kombinasyon veya keşif araçlarını kullanın.
          </p>
        ) : (
          <div className="max-h-[480px] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-zinc-50 text-xs text-zinc-500 dark:bg-zinc-950">
                <tr>
                  <th className="w-8 px-3 py-2" />
                  <th className="px-3 py-2">Keyword</th>
                  <th className="px-3 py-2">Intent</th>
                  <th className="px-3 py-2">Skor</th>
                  <th className="px-3 py-2">Kaynak</th>
                  <th className="px-3 py-2">Cluster</th>
                  <th className="w-28 px-2 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {visibleRoots.map((row) => {
                  const children = visibleChildren(row.id);
                  return (
                    <Fragment key={row.id}>
                      <tr
                        className={`group ${rowClass(row.selected, false)}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleParentWithChildren(row)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleParentWithChildren(row);
                          }
                        }}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={!!row.selected}
                            readOnly
                            tabIndex={-1}
                            aria-hidden
                            className="pointer-events-none"
                          />
                        </td>
                        <td className="px-3 py-2 font-medium text-zinc-800 dark:text-zinc-200">
                          {row.keyword}
                          {children.length > 0 && (
                            <span className="ml-2 text-[10px] font-normal text-zinc-400">
                              ({children.length} alt)
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <IntentBadge intent={row.search_intent} />
                        </td>
                        <td className="px-3 py-2 tabular-nums text-zinc-600">{row.score ?? 0}</td>
                        <td className="px-3 py-2 text-xs text-zinc-500">{row.source}</td>
                        <td className="px-3 py-2 text-xs text-zinc-400">
                          {row.cluster_name || "—"}
                        </td>
                        <td className="px-2 py-2 text-right">
                          <div
                            className={`flex justify-end gap-1 transition-opacity ${expandingId === row.id
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-100"
                              }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              title="Google Autocomplete (a–z long tail)"
                              disabled={!!expandingId}
                              onClick={(e) => handleExpandCandidate(row.id, e)}
                              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold shadow-sm disabled:opacity-60 ${expandingId === row.id
                                ? "bg-amber-500 text-white"
                                : "bg-emerald-600 text-white hover:bg-emerald-700 group-hover:ring-2 group-hover:ring-emerald-400/50"
                                }`}
                            >
                              {expandingId === row.id ? "…" : "AC"}
                            </button>
                            <button
                              type="button"
                              title="Adayı sil"
                              onClick={(e) => handleDeleteCandidate(row.id, e)}
                              className="rounded-md border border-zinc-300 bg-white px-1.5 py-1 text-xs font-medium text-zinc-600 hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-zinc-500 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-red-950"
                            >
                              ×
                            </button>
                          </div>
                        </td>
                      </tr>
                      {children.map((child) => (
                        <tr
                          key={child.id}
                          className={rowClass(child.selected, true)}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelection([child.id], !child.selected)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelection([child.id], !child.selected);
                            }
                          }}
                        >
                          <td className="px-3 py-1.5">
                            <input
                              type="checkbox"
                              checked={!!child.selected}
                              readOnly
                              tabIndex={-1}
                              aria-hidden
                              className="pointer-events-none"
                            />
                          </td>
                          <td className="py-1.5 pl-8 pr-3 text-xs text-zinc-600 dark:text-zinc-400">
                            <span className="mr-1.5 text-zinc-300">↳</span>
                            {child.keyword}
                          </td>
                          <td className="px-3 py-1.5">
                            <IntentBadge intent={child.search_intent} />
                          </td>
                          <td className="px-3 py-1.5 tabular-nums text-xs text-zinc-500">
                            {child.score ?? 0}
                          </td>
                          <td className="px-3 py-1.5 text-[10px] text-zinc-400">
                            {child.source}
                          </td>
                          <td className="px-3 py-1.5 text-[10px] text-zinc-400">—</td>
                          <td className="px-2 py-1.5 text-right">
                            <button
                              type="button"
                              title="Alt keyword sil"
                              onClick={(e) => handleDeleteCandidate(child.id, e)}
                              className="rounded-md px-1.5 py-0.5 text-xs text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Project keywords */}
      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          4. Projeye Kayıtlı Keywordler ({projectKeywords.length})
        </h3>
        {projectKeywords.length === 0 ? (
          <p className="text-sm text-zinc-400">Seçili adayları projeye kaydedin.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {projectKeywords.slice(0, 60).map((kw) => (
              <span
                key={kw.id}
                className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-2.5 py-1 text-xs dark:border-zinc-600"
              >
                {kw.keyword}
                {kw.cluster_name && (
                  <span className="text-zinc-400">· {kw.cluster_name}</span>
                )}
              </span>
            ))}
            {projectKeywords.length > 60 && (
              <span className="text-xs text-zinc-400">+{projectKeywords.length - 60} daha</span>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function ActionBtn({ label, hint, busy, onClick }) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className="rounded-lg border border-zinc-200 px-3 py-2.5 text-left text-sm hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
    >
      <span className="block font-medium text-zinc-800 dark:text-zinc-200">
        {busy ? "…" : label}
      </span>
      <span className="text-[10px] text-zinc-400">{hint}</span>
    </button>
  );
}
