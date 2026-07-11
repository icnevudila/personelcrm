"use client";

import { getDescriptionFontSize, getTitleFontSize } from "@/lib/roadmap/nodeDisplay";
import { getNodeTypeDef } from "@/lib/roadmap/constants";

function shapeClass(shape) {
  if (shape === "circle") return "rounded-full";
  if (shape === "diamond") return "rotate-45 rounded-lg";
  if (shape === "rectangle") return "rounded-md";
  return "rounded-xl";
}

export default function RoadmapNodeBox({ node, selected = false, onDoubleClick }) {
  const def = getNodeTypeDef(node.type);
  const innerRotate = def.shape === "diamond" ? "-rotate-45" : "";
  const titleSize = getTitleFontSize(node.title, node.width);
  const descSize = getDescriptionFontSize(node.description);
  const imageUrl = String(node.imageUrl || "").trim();

  return (
    <>
      {imageUrl ? (
        <div
          className="absolute -left-3 -top-3 z-30 h-9 w-9 overflow-hidden rounded-full border-2 bg-white shadow-md dark:bg-zinc-900"
          style={{ borderColor: node.color }}
        >
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover"
            draggable={false}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      ) : null}

      <div
        className={`relative flex h-full w-full flex-col items-center justify-center border-2 px-2.5 py-2 shadow-md ${shapeClass(def.shape)} ${innerRotate} ${
          selected ? "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-zinc-950" : ""
        }`}
        style={{
          backgroundColor: `${node.color}18`,
          borderColor: selected ? "#6366f1" : node.color,
        }}
        onDoubleClick={onDoubleClick}
      >
        <div className={`flex w-full min-w-0 flex-col items-center justify-center text-center ${innerRotate}`}>
          <p
            className="w-full break-words font-semibold leading-tight line-clamp-4"
            style={{ color: node.color, fontSize: titleSize }}
          >
            {node.title}
          </p>
          {node.description ? (
            <p
              className="mt-1 w-full break-words leading-snug text-zinc-600 line-clamp-3 dark:text-zinc-400"
              style={{ fontSize: descSize }}
            >
              {node.description}
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}
