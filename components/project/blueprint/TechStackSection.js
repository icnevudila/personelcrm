"use client";

import { useState } from "react";
import { SectionCard, inputCls, selectCls, btnPrimaryCls, labelCls } from "./ui";
import { TECH_CATEGORIES } from "@/lib/productBlueprint/constants";
import { createTech, patchTech, deleteTech } from "@/lib/productBlueprint/clientApi";

export default function TechStackSection({ projectId, techStack, onTechStackChange }) {
  const [technology, setTechnology] = useState("");
  const [category, setCategory] = useState("frontend");
  const [adding, setAdding] = useState(false);

  async function handleAdd(e) {
    e.preventDefault();
    if (!technology.trim()) return;
    setAdding(true);
    try {
      const created = await createTech(projectId, { technology: technology.trim(), category });
      onTechStackChange([...techStack, created]);
      setTechnology("");
    } finally {
      setAdding(false);
    }
  }

  async function removeTech(id) {
    await deleteTech(projectId, id);
    onTechStackChange(techStack.filter((t) => t.id !== id));
  }

  const grouped = TECH_CATEGORIES.map((cat) => ({
    ...cat,
    items: techStack.filter((t) => t.category === cat.id),
  }));

  return (
    <SectionCard title="Tech Stack" description="Kullanılan teknolojiler">
      <form onSubmit={handleAdd} className="mb-4 flex flex-wrap gap-2">
        <input value={technology} onChange={(e) => setTechnology(e.target.value)} placeholder="Örn: Next.js" className={`${inputCls} min-w-[10rem] flex-1`} />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${selectCls} w-36`}>
          {TECH_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <button type="submit" disabled={adding} className={btnPrimaryCls}>Ekle</button>
      </form>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {grouped.map((group) => (
          <div key={group.id} className="rounded-lg border border-zinc-100 p-3 dark:border-zinc-800">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">{group.label}</p>
            {group.items.length === 0 ? (
              <p className="text-xs text-zinc-400">—</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {group.items.map((tech) => (
                  <span key={tech.id} className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {tech.technology}
                    <button type="button" onClick={() => removeTech(tech.id)} className="text-zinc-400 hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
