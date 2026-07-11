"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const AUTO_SAVE_MS = 2000;

export function useAutoSave(isDirty, saveFn) {
  const [saveStatus, setSaveStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const savingRef = useRef(false);
  const saveFnRef = useRef(saveFn);
  saveFnRef.current = saveFn;

  const save = useCallback(async () => {
    if (!isDirty || savingRef.current) return;
    savingRef.current = true;
    setSaveStatus("saving");
    setErrorMsg("");
    try {
      await saveFnRef.current();
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch (err) {
      setSaveStatus("error");
      setErrorMsg(err.message);
    } finally {
      savingRef.current = false;
    }
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty) return;
    const timer = setTimeout(save, AUTO_SAVE_MS);
    return () => clearTimeout(timer);
  }, [isDirty, save]);

  return { saveStatus, errorMsg };
}
