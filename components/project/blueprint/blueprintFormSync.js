"use client";

import { useEffect, useRef } from "react";

function useSavedRef(saved) {
  const ref = useRef(saved);
  ref.current = saved;
  return ref;
}

function keepLocalIfDirty(current, savedRef, snap) {
  const dirty =
    typeof snap === "string" || snap === null || Array.isArray(snap)
      ? current !== savedRef.current
      : JSON.stringify(current) !== JSON.stringify(savedRef.current);
  return dirty ? current : snap;
}

export function useBlueprintSync(source, getSnapshot, setForm, setSavedForm, savedForm) {
  const savedRef = useSavedRef(savedForm);

  useEffect(() => {
    if (!source) return;
    const snap = getSnapshot(source);
    setForm((current) => keepLocalIfDirty(current, savedRef, snap));
    setSavedForm((saved) => keepLocalIfDirty(saved, savedRef, snap));
  }, [source, getSnapshot, setForm, setSavedForm]);
}
