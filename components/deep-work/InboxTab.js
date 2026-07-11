"use client";

import { useState } from "react";
import { useDeepWork } from "@/components/deep-work/DeepWorkProvider";
import TaskCard, { TaskFormFields, inputCls } from "@/components/deep-work/TaskCard";

export default function InboxTab() {
  const { projects, addTask } = useDeepWork();
  const [form, setForm] = useState({
    title: "",
    description: "",
    estimated_minutes: "",
    priority: "normal",
    project_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      await addTask({
        title: form.title,
        description: form.description,
        estimated_minutes: Number(form.estimated_minutes) || 0,
        priority: form.priority,
        project_id: form.project_id || null,
        status: "todo",
      });
      setForm({ title: "", description: "", estimated_minutes: "", priority: "normal", project_id: "" });
      setMsg("Inbox'a eklendi — Kanban'da Todo kolonunda görünür.");
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Inbox</h3>
        <p className="text-sm text-zinc-500">Aklınıza gelen işleri hızlıca ekleyin. Görevler Kanban Todo kolonuna düşer.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
        <TaskFormFields form={form} setForm={setForm} projects={projects} />
        {msg && <p className={`text-sm ${msg.includes("eklendi") ? "text-emerald-600" : "text-red-600"}`}>{msg}</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {saving ? "Ekleniyor…" : "Inbox'a ekle"}
        </button>
      </form>
    </div>
  );
}
