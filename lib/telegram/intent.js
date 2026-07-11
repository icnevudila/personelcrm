export const INTENTS = {
  HELP: "help",
  PROJECTS: "projects",
  PROJECT: "project",
  TODO: "todo",
  MARKETING: "marketing",
  BLUEPRINT: "blueprint",
  DEEPWORK: "deepwork",
  REPORT: "report",
  WEEKLY: "weekly",
  LAUNCH: "launch",
  STATUS: "status",
  CHAT: "chat",
  BRAIN_DUMP: "brain_dump",
  FEATURE: "feature",
  SPRINT: "sprint",
};

const SLASH_MAP = {
  "/help": INTENTS.HELP,
  "/projects": INTENTS.PROJECTS,
  "/project": INTENTS.PROJECT,
  "/todo": INTENTS.TODO,
  "/marketing": INTENTS.MARKETING,
  "/blueprint": INTENTS.BLUEPRINT,
  "/deepwork": INTENTS.DEEPWORK,
  "/report": INTENTS.REPORT,
  "/weekly": INTENTS.WEEKLY,
  "/launch": INTENTS.LAUNCH,
  "/status": INTENTS.STATUS,
};

const PATTERNS = [
  { intent: INTENTS.HELP, re: /yardım|help|neler yapabiliyor|ne yapabilir/i },
  { intent: INTENTS.PROJECTS, re: /projeler(im)?\s*(listele|göster)?/i },
  { intent: INTENTS.STATUS, re: /(ne durumda|durum(u|unu)|status)/i },
  { intent: INTENTS.TODO, re: /todo|görev|yapılacak|yapilacak/i },
  { intent: INTENTS.MARKETING, re: /pazarlama|marketing|içerik|icerik|launch plan/i },
  { intent: INTENTS.BLUEPRINT, re: /blueprint|ürün plan|urun plan|value proposition|hedef kitle/i },
  { intent: INTENTS.DEEPWORK, re: /deep work|odak|bugün ne yap|bugun ne yap|2 saat/i },
  { intent: INTENTS.REPORT, re: /günlük rapor|gunluk rapor|bugün yapılan|bugun yapilan|daily report/i },
  { intent: INTENTS.WEEKLY, re: /haftalık|haftalik|weekly/i },
  { intent: INTENTS.LAUNCH, re: /launch|lansman|hazır mıyız|hazir miyiz/i },
  { intent: INTENTS.BRAIN_DUMP, re: /not al|brain dump|fikir kaydet|inbox/i },
  { intent: INTENTS.FEATURE, re: /özellik ekle|ozellik ekle|feature|ekleyelim/i },
  { intent: INTENTS.SPRINT, re: /sprint/i },
];

export function detectIntent(text) {
  const trimmed = String(text || "").trim();
  const lower = trimmed.toLowerCase();

  const slashCmd = trimmed.split(/\s/)[0];
  if (SLASH_MAP[slashCmd]) {
    return { intent: SLASH_MAP[slashCmd], text: trimmed.slice(slashCmd.length).trim(), source: "slash" };
  }

  for (const { intent, re } of PATTERNS) {
    if (re.test(lower)) {
      return { intent, text: trimmed, source: "pattern" };
    }
  }

  return { intent: INTENTS.CHAT, text: trimmed, source: "default" };
}

export function extractProjectHint(text, projects = []) {
  const lower = text.toLowerCase();
  for (const p of projects) {
    if (lower.includes(p.name.toLowerCase())) return p;
  }
  const words = lower.split(/\s+/);
  for (const p of projects) {
    const pWords = p.name.toLowerCase().split(/\s+/);
    if (pWords.some((w) => w.length > 3 && words.includes(w))) return p;
  }
  return null;
}
