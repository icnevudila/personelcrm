import { normalizeAnnotations } from "./annotations";
import { ANCHORS, getNodeTypeDef, migrateAnchor } from "./constants";

export function normalizeCanvasData(raw) {
  const data = raw && typeof raw === "object" ? raw : {};
  return {
    viewport: {
      scrollX: Number(data.viewport?.scrollX) || 0,
      scrollY: Number(data.viewport?.scrollY) || 0,
    },
    nodes: Array.isArray(data.nodes)
      ? data.nodes.map((n) => ({
          id: String(n.id),
          type: String(n.type || "project"),
          title: String(n.title || "Yeni öğe"),
          description: String(n.description || ""),
          color: String(n.color || "#6366f1"),
          imageUrl: String(n.imageUrl || "").trim(),
          x: Number(n.x) || 0,
          y: Number(n.y) || 0,
          width: Number(n.width) || getNodeTypeDef(n.type).width,
          height: Number(n.height) || getNodeTypeDef(n.type).height,
        }))
      : [],
    edges: Array.isArray(data.edges)
      ? data.edges.map((e) => ({
          id: String(e.id),
          fromNodeId: String(e.fromNodeId),
          fromAnchor: migrateAnchor(e.fromAnchor),
          toNodeId: String(e.toNodeId),
          toAnchor: migrateAnchor(e.toAnchor),
        }))
      : [],
    annotations: normalizeAnnotations(data.annotations),
  };
}

export function getAnchorPoint(node, anchor) {
  const { x, y, width, height } = node;
  const a = migrateAnchor(anchor);
  switch (a) {
    case "top":
      return { x: x + width / 2, y };
    case "right":
      return { x: x + width, y: y + height / 2 };
    case "bottom":
      return { x: x + width / 2, y: y + height };
    case "left":
      return { x, y: y + height / 2 };
    default:
      return { x: x + width / 2, y: y + height / 2 };
  }
}

/** Kenar ortası + butonunun node içindeki konumu */
export function getAnchorButtonPosition(node, anchor, stackIndex = 0) {
  const a = migrateAnchor(anchor);
  const { width, height } = node;
  const half = 10;
  const stack = stackIndex * 14;

  switch (a) {
    case "top":
      return { left: width / 2 - half, top: -half - stack };
    case "right":
      return { left: width - half + stack, top: height / 2 - half };
    case "bottom":
      return { left: width / 2 - half, top: height - half + stack };
    case "left":
      return { left: -half - stack, top: height / 2 - half };
    default:
      return { left: width / 2 - half, top: height / 2 - half };
  }
}

function anchorDirection(anchor) {
  const a = migrateAnchor(anchor);
  switch (a) {
    case "top":
      return { x: 0, y: -1 };
    case "right":
      return { x: 1, y: 0 };
    case "bottom":
      return { x: 0, y: 1 };
    case "left":
      return { x: -1, y: 0 };
    default:
      return { x: 0, y: 0 };
  }
}

export function buildEdgePath(from, to, fromAnchor = "right", toAnchor = "left") {
  const offset = 48;
  const fromDir = anchorDirection(fromAnchor);
  const toDir = anchorDirection(toAnchor);
  const c1x = from.x + fromDir.x * offset;
  const c1y = from.y + fromDir.y * offset;
  const c2x = to.x + toDir.x * offset;
  const c2y = to.y + toDir.y * offset;
  return `M ${from.x} ${from.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${to.x} ${to.y}`;
}

export function canvasFingerprint(data) {
  return JSON.stringify(normalizeCanvasData(data));
}

export function getCanvasCenter(scrollEl) {
  if (!scrollEl) return { x: 400, y: 300 };
  return {
    x: scrollEl.scrollLeft + scrollEl.clientWidth / 2 - 100,
    y: scrollEl.scrollTop + scrollEl.clientHeight / 2 - 44,
  };
}
