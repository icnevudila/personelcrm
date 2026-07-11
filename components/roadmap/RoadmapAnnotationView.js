"use client";

import { getTitleFontSize } from "@/lib/roadmap/nodeDisplay";
import { getFrameFillColor, isLineType } from "@/lib/roadmap/annotations";

export default function RoadmapAnnotationView({ annotation, selected, onDoubleClick }) {
  const { type } = annotation;

  if (type === "frame") {
    const label = String(annotation.title || "").trim();
    return (
      <div
        className={`relative h-full w-full rounded-xl ${selected ? "ring-2 ring-indigo-400 ring-offset-1" : ""}`}
        style={{
          border: `${annotation.strokeWidth}px solid ${annotation.color}`,
          backgroundColor: getFrameFillColor(annotation.color),
        }}
      >
        {label ? (
          <span
            className="absolute left-3 top-2.5 text-xs font-semibold leading-none"
            style={{ color: annotation.color }}
          >
            {label}
          </span>
        ) : null}
      </div>
    );
  }

  if (type === "note") {
    return (
      <div
        className={`h-full w-full rounded-lg border border-black/5 p-3 shadow-md ${selected ? "ring-2 ring-indigo-400" : ""}`}
        style={{ backgroundColor: annotation.backgroundColor || "#fef08a" }}
        onDoubleClick={onDoubleClick}
      >
        <p
          className="h-full w-full whitespace-pre-wrap break-words leading-snug"
          style={{ color: annotation.color, fontSize: annotation.fontSize }}
        >
          {annotation.title}
        </p>
      </div>
    );
  }

  if (type === "heading") {
    const fs = annotation.fontSize || getTitleFontSize(annotation.title, annotation.width);
    return (
      <div
        className={`flex h-full w-full items-center justify-center ${selected ? "ring-2 ring-indigo-400 rounded-lg" : ""}`}
        onDoubleClick={onDoubleClick}
      >
        <p
          className="w-full break-words text-center font-bold leading-tight"
          style={{ color: annotation.color, fontSize: fs }}
        >
          {annotation.title}
        </p>
      </div>
    );
  }

  if (type === "text") {
    return (
      <div
        className={`flex h-full w-full items-center justify-center ${selected ? "ring-2 ring-indigo-400 rounded-lg" : ""}`}
        onDoubleClick={onDoubleClick}
      >
        <p
          className="w-full break-words text-center leading-snug"
          style={{ color: annotation.color, fontSize: annotation.fontSize }}
        >
          {annotation.title}
        </p>
      </div>
    );
  }

  return null;
}

export function isBoxAnnotation(type) {
  return !isLineType(type);
}
