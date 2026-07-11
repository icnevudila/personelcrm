"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  createTask,
  deleteTask,
  fetchActiveSession,
  fetchProjects,
  fetchSettings,
  fetchStats,
  fetchTasks,
  moveTask,
  saveSettings,
  startSession,
  stopSession,
  updateTask,
} from "@/lib/deep-work/clientApi";
import { TIMER_STORAGE_KEY } from "@/lib/deep-work/constants";

const DeepWorkContext = createContext(null);

export function DeepWorkProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [settings, setSettings] = useState(null);
  const [stats, setStats] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const [allTasks, proj, sett, st, session] = await Promise.all([
        fetchTasks({ include_archive: true }),
        fetchProjects(),
        fetchSettings(),
        fetchStats(),
        fetchActiveSession(),
      ]);
      setTasks(allTasks);
      setProjects(proj);
      setSettings(sett);
      setStats(st);
      setActiveSession(session);
      if (session?.id) {
        localStorage.setItem(
          TIMER_STORAGE_KEY,
          JSON.stringify({ sessionId: session.id, taskId: session.task_id, startedAt: session.started_at })
        );
      } else {
        localStorage.removeItem(TIMER_STORAGE_KEY);
      }
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const addTask = useCallback(async (payload) => {
    const task = await createTask(payload);
    setTasks((prev) => [...prev, task]);
    return task;
  }, []);

  const patchTask = useCallback(async (id, payload) => {
    const task = await updateTask(id, payload);
    setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
    return task;
  }, []);

  const removeTask = useCallback(async (id) => {
    await deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const reorderTasks = useCallback(async (orderedIds, status) => {
    await moveTask({ ordered_ids: orderedIds, status });
    await reload();
  }, [reload]);

  const moveTaskTo = useCallback(async (taskId, status, sortOrder) => {
    const task = await moveTask({ task_id: taskId, status, sort_order: sortOrder });
    setTasks((prev) => prev.map((t) => (t.id === taskId ? task : t)));
    return task;
  }, []);

  const beginSession = useCallback(async (taskId, sessionType = "focus") => {
    const session = await startSession(taskId, sessionType);
    setActiveSession(session);
    localStorage.setItem(
      TIMER_STORAGE_KEY,
      JSON.stringify({ sessionId: session.id, taskId: session.task_id, startedAt: session.started_at })
    );
    await reload();
    return session;
  }, [reload]);

  const endSession = useCallback(async () => {
    if (!activeSession?.id) return;
    await stopSession(activeSession.id);
    setActiveSession(null);
    localStorage.removeItem(TIMER_STORAGE_KEY);
    await reload();
  }, [activeSession, reload]);

  const updateSettings = useCallback(async (payload) => {
    const s = await saveSettings(payload);
    setSettings(s);
    return s;
  }, []);

  const value = useMemo(
    () => ({
      tasks,
      projects,
      settings,
      stats,
      activeSession,
      loading,
      error,
      reload,
      addTask,
      patchTask,
      removeTask,
      reorderTasks,
      moveTaskTo,
      beginSession,
      endSession,
      updateSettings,
    }),
    [
      tasks,
      projects,
      settings,
      stats,
      activeSession,
      loading,
      error,
      reload,
      addTask,
      patchTask,
      removeTask,
      reorderTasks,
      moveTaskTo,
      beginSession,
      endSession,
      updateSettings,
    ]
  );

  return <DeepWorkContext.Provider value={value}>{children}</DeepWorkContext.Provider>;
}

export function useDeepWork() {
  const ctx = useContext(DeepWorkContext);
  if (!ctx) throw new Error("useDeepWork DeepWorkProvider içinde kullanılmalı");
  return ctx;
}
