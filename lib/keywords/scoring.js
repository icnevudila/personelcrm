import { detectSearchIntent } from "./intent";

export function calculateOpportunityScore(keyword, ctx = {}) {
  const k = (keyword || "").toLowerCase().trim();
  let score = 20;
  const words = k.split(/\s+/).filter(Boolean);

  if (words.length >= 3) score += 15;
  if (words.length >= 5) score += 10;

  if (ctx.city && k.includes(ctx.city.toLowerCase())) score += 15;
  if (ctx.district && k.includes(ctx.district.toLowerCase())) score += 12;

  if (/fiyat|ücret|ucret|ne kadar|tarife/.test(k)) score += 18;
  if (/acil|7\s*\/\s*24|7\s*24|gece/.test(k)) score += 16;
  if (/nasıl|nasil|nedir|ne yapmalı|\?/.test(k)) score += 10;

  const intent = detectSearchIntent(keyword, ctx);
  if (intent === "Commercial") score += 8;
  if (intent === "Emergency") score += 8;
  if (intent === "Local") score += 6;

  return Math.min(100, Math.max(0, score));
}
