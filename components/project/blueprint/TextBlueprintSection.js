"use client";

import { useCallback, useState } from "react";
import { SectionCard, SaveIndicator, textareaCls } from "./ui";
import { useAutoSave } from "./useAutoSave";
import { useBlueprintSync } from "./blueprintFormSync";
import { patchBlueprint } from "@/lib/productBlueprint/clientApi";

export default function TextBlueprintSection({ projectId, blueprint, onUpdate, title, description, field }) {
  const [value, setValue] = useState("");
  const [savedValue, setSavedValue] = useState("");

  useBlueprintSync(
    blueprint,
    useCallback((bp) => bp[field] || "", [field]),
    setValue,
    setSavedValue,
    savedValue
  );

  const isDirty = value !== savedValue;

  const { saveStatus, errorMsg } = useAutoSave(
    isDirty,
    useCallback(async () => {
      const updated = await patchBlueprint(projectId, { [field]: value });
      onUpdate(updated);
      setSavedValue(value);
    }, [field, value, projectId, onUpdate])
  );

  return (
    <SectionCard
      title={title}
      description={description}
      action={<SaveIndicator saveStatus={saveStatus} errorMsg={errorMsg} />}
    >
      <textarea value={value} onChange={(e) => setValue(e.target.value)} className={textareaCls} rows={4} />
    </SectionCard>
  );
}
