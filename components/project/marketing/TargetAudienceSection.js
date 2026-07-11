"use client";

import { useEffect, useState } from "react";
import { SectionCard, textareaCls, labelCls, btnPrimaryCls } from "./ui";
import { patchBlueprint } from "@/lib/marketing/clientApi";

export default function TargetAudienceSection({ projectId, blueprint, onUpdate }) {
  const [form, setForm] = useState({
    target_audience: "",
    problem: "",
    solution: "",
    competitors: "",
    value_proposition: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!blueprint) return;
    setForm({
      target_audience: blueprint.target_audience || "",
      problem: blueprint.problem || "",
      solution: blueprint.solution || "",
      competitors: blueprint.competitors || "",
      value_proposition: blueprint.value_proposition || "",
    });
  }, [blueprint]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await patchBlueprint(projectId, form);
      onUpdate(updated);
    } finally {
      setSaving(false);
    }
  }

  const fields = [
    { key: "target_audience", label: "Hedef Kitle" },
    { key: "problem", label: "Problem" },
    { key: "solution", label: "Çözüm" },
    { key: "competitors", label: "Rakipler" },
    { key: "value_proposition", label: "Değer Önerisi" },
  ];

  return (
    <SectionCard
      title="Target Audience"
      action={
        <button type="button" onClick={handleSave} disabled={saving} className={btnPrimaryCls}>
          {saving ? "Kaydediliyor…" : "Kaydet"}
        </button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.key} className={f.key === "value_proposition" ? "sm:col-span-2" : ""}>
            <label className={labelCls}>{f.label}</label>
            <textarea
              value={form[f.key]}
              onChange={(e) => setField(f.key, e.target.value)}
              className={textareaCls}
              rows={3}
            />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
