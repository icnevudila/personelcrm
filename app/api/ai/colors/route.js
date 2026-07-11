import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const REQUIRED_COLOR_KEYS = ["primary", "secondary", "accent", "background", "text"];

function ensureHex(input, fallback) {
  if (typeof input !== "string") return fallback;
  const value = input.trim();
  if (!value) return fallback;
  if (value.startsWith("#")) return value;
  if (/^[0-9a-fA-F]{6}$/.test(value)) return `#${value}`;
  return fallback;
}

function normalizePalette(item, index) {
  const colors = item?.colors && typeof item.colors === "object" ? item.colors : item;
  const fallback = {
    primary: "#1D4ED8",
    secondary: "#2563EB",
    accent: "#38BDF8",
    background: "#F8FAFC",
    text: "#0F172A",
  };

  const normalizedColors = {};
  for (const key of REQUIRED_COLOR_KEYS) {
    normalizedColors[key] = ensureHex(colors?.[key], fallback[key]);
  }

  return {
    name: typeof item?.name === "string" && item.name.trim() ? item.name.trim() : `Palette ${index + 1}`,
    colors: normalizedColors,
  };
}

function extractPalettes(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (!parsed || typeof parsed !== "object") return [];

  if (Array.isArray(parsed.palettes)) return parsed.palettes;
  if (Array.isArray(parsed.data)) return parsed.data;
  if (Array.isArray(parsed.items)) return parsed.items;
  if (Array.isArray(parsed.result)) return parsed.result;

  if (parsed.colors && typeof parsed.colors === "object") return [parsed];

  const values = Object.values(parsed).filter((value) => value && typeof value === "object");
  if (values.length > 0) return values;

  return [];
}

export async function POST(request) {
  const supabase = await createClient();

  const { sector, brand_tone, main_goal, project_id } = await request.json();

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = [
    `You are a professional UI/UX designer. Generate 3 distinct color palette suggestions for a ${sector || "business"} website.`,
    `Brand tone: ${brand_tone || "professional"}.`,
    main_goal ? `Main goal: ${main_goal}.` : "",
    "For each palette, provide exactly 5 hex colors: primary, secondary, accent, background, text.",
    "Return ONLY valid JSON array with this structure, no other text:",
    `[{"name":"Palette 1","colors":{"primary":"#hex","secondary":"#hex","accent":"#hex","background":"#hex","text":"#hex"}},...]`,
  ]
    .filter(Boolean)
    .join(" ");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 400,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content;
  try {
    const parsed = JSON.parse(raw);
    const extracted = extractPalettes(parsed);
    const palettes = extracted.slice(0, 3).map((palette, index) => normalizePalette(palette, index));

    if (project_id && palettes.length > 0) {
      const { error } = await supabase
        .from("installation_forms")
        .update({
          color_palette_mode: "ai",
          color_generate: true,
          color_ai_palettes: palettes,
        })
        .eq("project_id", project_id);

      if (error) {
        return NextResponse.json({ error: "AI paletleri kaydedilemedi: " + error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ palettes });
  } catch {
    return NextResponse.json({ error: "Renk paleti ayrıştırılamadı" }, { status: 500 });
  }
}
