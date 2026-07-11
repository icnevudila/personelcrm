export const TASK_STATUSES = ["todo", "doing", "done", "archive"];

export const STATUS_LABELS = {
  todo: "Todo",
  doing: "Doing",
  done: "Done",
  archive: "Arşiv",
};

export const PRIORITY_LABELS = {
  low: "Düşük",
  normal: "Normal",
  high: "Yüksek",
};

export const PRIORITY_COLORS = {
  low: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  normal: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  high: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
};

export const DEFAULT_DAILY_GOAL = 120;
export const DEFAULT_POMODORO_WORK = 25;
export const DEFAULT_POMODORO_BREAK = 5;

export const DEEP_WORK_TABS = [
  { key: "dashboard", label: "Odak" },
  { key: "inbox", label: "Inbox" },
  { key: "kanban", label: "Kanban" },
  { key: "plan", label: "Günlük Plan" },
  { key: "calendar", label: "Takvim" },
  { key: "stats", label: "İstatistik" },
  { key: "archive", label: "Arşiv" },
  { key: "review", label: "Gün Sonu" },
];

export const TIMER_STORAGE_KEY = "deep_work_active_session";
