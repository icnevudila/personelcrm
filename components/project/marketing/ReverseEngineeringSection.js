"use client";

import { useEffect, useState } from "react";
import { SectionCard, textareaCls, labelCls, btnPrimaryCls } from "./ui";
import { REVERSE_ENGINEERING_FIELDS } from "@/lib/marketing/constants";
import { patchBlueprint } from "@/lib/marketing/clientApi";

export default function ReverseEngineeringSection({ projectId, blueprint, onUpdate }) {
  const [data, setData] = useState(blueprint?.reverse_engineering || {});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setData(blueprint?.reverse_engineering || {});
  }, [blueprint]);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await patchBlueprint(projectId, { reverse_engineering: data });
      onUpdate(updated);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard
      title="Reverse Engineering"
      description="Rakip stratejilerini not alın ve analiz edin."
      action={
        <button type="button" onClick={handleSave} disabled={saving} className={btnPrimaryCls}>
          {saving ? "Kaydediliyor…" : "Kaydet"}
        </button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {REVERSE_ENGINEERING_FIELDS.map((f) => (
          <div key={f.key} className={f.key === "notes" ? "sm:col-span-2" : ""}>
            <label className={labelCls}>{f.label}</label>
            <textarea
              value={data[f.key] || ""}
              onChange={(e) => setData((prev) => ({ ...prev, [f.key]: e.target.value }))}
              className={textareaCls}
              rows={3}
            />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
