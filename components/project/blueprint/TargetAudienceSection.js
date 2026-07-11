"use client";

import { useCallback, useState } from "react";
import { SectionCard, SaveIndicator, inputCls, textareaCls, selectCls, labelCls } from "./ui";
import { useAutoSave } from "./useAutoSave";
import { useBlueprintSync } from "./blueprintFormSync";
import { USER_TYPES, COMPANY_TYPES } from "@/lib/productBlueprint/constants";
import { patchBlueprint } from "@/lib/productBlueprint/clientApi";

function snapshotFromBlueprint(blueprint) {
  return {
    target_audience: blueprint?.target_audience || "",
    industry: blueprint?.industry || "",
    country: blueprint?.country || "",
    user_type: blueprint?.user_type || "",
    company_type: blueprint?.company_type || "",
  };
}

export default function TargetAudienceSection({ projectId, blueprint, onUpdate }) {
  const [form, setForm] = useState(snapshotFromBlueprint(null));
  const [savedForm, setSavedForm] = useState(snapshotFromBlueprint(null));

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

  return (
    <SectionCard title="Target Audience" action={<SaveIndicator saveStatus={saveStatus} errorMsg={errorMsg} />}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelCls}>Hedef Kitle</label>
          <textarea
            value={form.target_audience}
            onChange={(e) => setForm({ ...form, target_audience: e.target.value })}
            className={textareaCls}
            rows={2}
          />
        </div>
        <div>
          <label className={labelCls}>Sektör</label>
          <input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Ülke</label>
          <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Kullanıcı Tipi</label>
          <select value={form.user_type} onChange={(e) => setForm({ ...form, user_type: e.target.value })} className={selectCls}>
            <option value="">Seçin</option>
            {USER_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Şirket Tipi</label>
          <select value={form.company_type} onChange={(e) => setForm({ ...form, company_type: e.target.value })} className={selectCls}>
            <option value="">Seçin</option>
            {COMPANY_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
    </SectionCard>
  );
}
