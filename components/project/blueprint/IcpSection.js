"use client";

import { useCallback, useState } from "react";
import { SectionCard, SaveIndicator, inputCls, labelCls } from "./ui";
import { useAutoSave } from "./useAutoSave";
import { useBlueprintSync } from "./blueprintFormSync";
import { DEFAULT_ICP } from "@/lib/productBlueprint/constants";
import { patchBlueprint } from "@/lib/productBlueprint/clientApi";

const ICP_FIELDS = [
  { key: "user_profile", label: "Kullanıcı Profili" },
  { key: "company_size", label: "Şirket Büyüklüğü" },
  { key: "employee_count", label: "Çalışan Sayısı" },
  { key: "estimated_budget", label: "Tahmini Bütçe" },
  { key: "decision_maker", label: "Karar Verici" },
  { key: "technical_level", label: "Teknik Seviyesi" },
];

export default function IcpSection({ projectId, blueprint, onUpdate }) {
  const [icp, setIcp] = useState(DEFAULT_ICP);
  const [savedIcp, setSavedIcp] = useState(DEFAULT_ICP);

  useBlueprintSync(
    blueprint,
    useCallback((bp) => ({ ...DEFAULT_ICP, ...(bp.ideal_customer_profile || {}) }), []),
    setIcp,
    setSavedIcp,
    savedIcp
  );

  const isDirty = JSON.stringify(icp) !== JSON.stringify(savedIcp);

  const { saveStatus, errorMsg } = useAutoSave(
    isDirty,
    useCallback(async () => {
      const updated = await patchBlueprint(projectId, { ideal_customer_profile: icp });
      onUpdate(updated);
      setSavedIcp(icp);
    }, [icp, projectId, onUpdate])
  );

  return (
    <SectionCard
      title="Ideal Customer Profile (ICP)"
      action={<SaveIndicator saveStatus={saveStatus} errorMsg={errorMsg} />}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {ICP_FIELDS.map((f) => (
          <div key={f.key}>
            <label className={labelCls}>{f.label}</label>
            <input
              value={icp[f.key] || ""}
              onChange={(e) => setIcp({ ...icp, [f.key]: e.target.value })}
              className={inputCls}
            />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
