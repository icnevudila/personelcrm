import { DEFAULT_COLOR } from "./constants";

export const NOTE_COLORS = [
  { value: "#fef08a", label: "Sarı" },
  { value: "#fbcfe8", label: "Pembe" },
  { value: "#bbf7d0", label: "Yeşil" },
  { value: "#bfdbfe", label: "Mavi" },
  { value: "#e9d5ff", label: "Mor" },
  { value: "#fed7aa", label: "Turuncu" },
];

export const ANNOTATION_TYPES = [
  { id: "heading", label: "Başlık", icon: "H", group: "front" },
  { id: "text", label: "Metin", icon: "T", group: "front" },
  { id: "note", label: "Not", icon: "N", group: "front" },
  { id: "frame", label: "Çerçeve", icon: "▢", group: "back" },
  { id: "line", label: "Çizgi", icon: "—", group: "mid" },
  { id: "arrow", label: "Ok", icon: "→", group: "mid" },
];

const DEFAULTS = {
  heading: { width: 360, height: 56, fontSize: 28, title: "Başlık", color: "#18181b" },
  text: { width: 260, height: 52, fontSize: 16, title: "Metin", color: "#3f3f46" },
  note: { width: 190, height: 150, fontSize: 14, title: "Not yaz…", color: "#713f12", backgroundColor: "#fef08a" },
  frame: { width: 420, height: 300, title: "", color: "#71717a", strokeWidth: 2 },
  line: { strokeWidth: 2, color: "#52525b", length: 220 },
  arrow: { strokeWidth: 2, color: "#52525b", length: 220 },
};

export function getFrameFillColor(color) {
  return `${color || "#71717a"}12`;
}

export function isLineType(type) {
  return type === "line" || type === "arrow";
}

export function getAnnotationTypeDef(typeId) {
  return ANNOTATION_TYPES.find((t) => t.id === typeId) || ANNOTATION_TYPES[0];
}

export function createAnnotation(typeId, center, index = 0, id = `ann_${index}`) {
  const offset = index * 16;
  const cx = center.x + offset;
  const cy = center.y + offset;
  const def = DEFAULTS[typeId] || DEFAULTS.text;

  if (isLineType(typeId)) {
    const len = def.length || 200;
    return {
      id,
      type: typeId,
      x1: cx - len / 2,
      y1: cy,
      x2: cx + len / 2,
      y2: cy,
      color: def.color,
      strokeWidth: def.strokeWidth,
    };
  }

  return {
    id,
    type: typeId,
    x: Math.max(20, cx - (def.width || 200) / 2),
    y: Math.max(20, cy - (def.height || 80) / 2),
    width: def.width,
    height: def.height,
    title: def.title ?? "",
    color: def.color || DEFAULT_COLOR,
    fontSize: def.fontSize || 16,
    backgroundColor: def.backgroundColor,
    strokeWidth: def.strokeWidth || 2,
  };
}

export function normalizeAnnotations(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((a) => {
    const type = String(a.type || "text");
    const base = {
      id: String(a.id),
      type,
      color: String(a.color || "#52525b"),
      strokeWidth: Number(a.strokeWidth) || 2,
      title: String(a.title ?? ""),
      fontSize: Number(a.fontSize) || 16,
    };

    if (isLineType(type)) {
      return {
        ...base,
        x1: Number(a.x1) || 0,
        y1: Number(a.y1) || 0,
        x2: Number(a.x2) || 200,
        y2: Number(a.y2) || 0,
      };
    }

    return {
      ...base,
      x: Number(a.x) || 0,
      y: Number(a.y) || 0,
      width: Number(a.width) || 200,
      height: Number(a.height) || 80,
      backgroundColor: a.backgroundColor != null ? String(a.backgroundColor) : undefined,
    };
  });
}

export function buildLinePath(x1, y1, x2, y2) {
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}

export function buildArrowPath(x1, y1, x2, y2) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const head = 12;
  const a1 = angle - Math.PI / 6;
  const a2 = angle + Math.PI / 6;
  const hx1 = x2 - head * Math.cos(a1);
  const hy1 = y2 - head * Math.sin(a1);
  const hx2 = x2 - head * Math.cos(a2);
  const hy2 = y2 - head * Math.sin(a2);
  return `M ${x1} ${y1} L ${x2} ${y2} M ${hx1} ${hy1} L ${x2} ${y2} L ${hx2} ${hy2}`;
}
