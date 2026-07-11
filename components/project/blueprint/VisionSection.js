"use client";

import { useCallback, useState } from "react";
import { SectionCard, SaveIndicator, textareaCls, labelCls } from "./ui";
import { useAutoSave } from "./useAutoSave";
import { useBlueprintSync } from "./blueprintFormSync";
import { patchBlueprint } from "@/lib/productBlueprint/clientApi";

function snapshotFromBlueprint(blueprint) {
  return {
    vision: blueprint?.vision || "",
    mission: blueprint?.mission || "",
    long_term_goal: blueprint?.long_term_goal || "",
  };
}

export default function VisionSection({ projectId, blueprint, onUpdate }) {
  const [form, setForm] = useState({ vision: "", mission: "", long_term_goal: "" });
  const [savedForm, setSavedForm] = useState({ vision: "", mission: "", long_term_goal: "" });

  useBlueprintSync(blueprint, snapshotFromBlueprint, setForm, setSavedForm, savedForm);

  const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm);

  const { saveStatus, errorMsg } = useAutoSave(
    isDirty,
    useCallback(async () => {
      const updated = await patchBlueprint(projectId, form);
      onUpdate(updated);
      setSavedForm(form);
    }, [form, projectId, onUpdate])
  );

  const fields = [
    { key: "vision", label: "Vizyon" },
    { key: "mission", label: "Misyon" },
    { key: "long_term_goal", label: "Uzun Vadeli Hedef" },
  ];

  return (
    <SectionCard title="Project Vision" action={<SaveIndicator saveStatus={saveStatus} errorMsg={errorMsg} />}>
      <div className="space-y-3">
        {fields.map((f) => (
          <div key={f.key}>
            <label className={labelCls}>{f.label}</label>
            <textarea
              value={form[f.key]}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              className={textareaCls}
              rows={3}
            />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
