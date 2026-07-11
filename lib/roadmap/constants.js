export const CANVAS_WIDTH = 6000;
export const CANVAS_HEIGHT = 4500;

export const ANCHORS = ["top", "right", "bottom", "left"];

const LEGACY_ANCHOR_MAP = {
  "top-left": "top",
  "top-right": "top",
  "bottom-left": "bottom",
  "bottom-right": "bottom",
  left: "left",
  right: "right",
};

export const NODE_COLORS = [
  { id: "indigo", value: "#6366f1", label: "İndigo" },
  { id: "blue", value: "#3b82f6", label: "Mavi" },
  { id: "emerald", value: "#10b981", label: "Yeşil" },
  { id: "amber", value: "#f59e0b", label: "Amber" },
  { id: "rose", value: "#f43f5e", label: "Gül" },
  { id: "violet", value: "#8b5cf6", label: "Mor" },
  { id: "zinc", value: "#71717a", label: "Gri" },
  { id: "cyan", value: "#06b6d4", label: "Camgöbeği" },
];

export const NODE_TYPES = [
  { id: "project", label: "Proje", width: 220, height: 96, shape: "rounded" },
  { id: "milestone", label: "Kilometre Taşı", width: 200, height: 88, shape: "rounded" },
  { id: "step", label: "Ara Adım", width: 180, height: 80, shape: "rectangle" },
  { id: "decision", label: "Karar", width: 120, height: 120, shape: "diamond" },
  { id: "idea", label: "Fikir", width: 110, height: 110, shape: "circle" },
  { id: "launch", label: "Lansman", width: 200, height: 88, shape: "rounded" },
];

export const DEFAULT_COLOR = NODE_COLORS[0].value;

export function emptyCanvasData() {
  return {
    viewport: { scrollX: 0, scrollY: 0 },
    nodes: [],
    edges: [],
    annotations: [],
  };
}

export function migrateAnchor(anchor) {
  if (ANCHORS.includes(anchor)) return anchor;
  return LEGACY_ANCHOR_MAP[anchor] || "top";
}

export function getNodeTypeDef(typeId) {
  return NODE_TYPES.find((t) => t.id === typeId) || NODE_TYPES[0];
}
