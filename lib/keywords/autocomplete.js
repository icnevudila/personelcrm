const SUFFIXES = "abcdefghijklmnopqrstuvwxyz".split("");
const BATCH_SIZE = 8;
const LOG = process.env.KEYWORD_AUTOCOMPLETE_DEBUG === "1";

function log(...args) {
  if (LOG) console.log("[keyword-autocomplete]", ...args);
}

export async function fetchGoogleSuggestions(query) {
  const q = encodeURIComponent(query.trim());
  const url = `https://suggestqueries.google.com/complete/search?client=chrome&hl=tr&q=${q}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json,text/plain,*/*",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      log("http_error", query, res.status);
      return [];
    }

    const text = await res.text();
    if (text.startsWith("<!DOCTYPE") || text.startsWith("<html")) {
      log("html_error", query);
      return [];
    }

    const parsed = JSON.parse(text);
    const suggestions = parsed[1];
    if (!Array.isArray(suggestions)) {
      log("parse_empty", query, text.slice(0, 120));
      return [];
    }

    const items = suggestions
      .map((item) => (typeof item === "string" ? item : item?.[0] || ""))
      .filter(Boolean);

    log("ok", query, items.length);
    return items;
  } catch (err) {
    log("fetch_fail", query, err.message);
    return [];
  }
}

async function runBatched(queries) {
  const found = new Set();

  for (let i = 0; i < queries.length; i += BATCH_SIZE) {
    const batch = queries.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map((q) => fetchGoogleSuggestions(q)));
    results.flat().forEach((s) => found.add(s.toLowerCase().trim()));
    if (i + BATCH_SIZE < queries.length) {
      await new Promise((r) => setTimeout(r, 120));
    }
  }

  return found;
}

export async function expandKeywordWithAlphabet(seed, { includeBase = true } = {}) {
  const base = seed.trim();
  if (!base) return [];

  const queries = includeBase ? [base] : [];
  for (const letter of SUFFIXES) {
    queries.push(`${base} ${letter}`);
  }

  log("expand_start", base, "queries", queries.length);
  const found = await runBatched(queries);
  const list = [...found];
  log("expand_done", base, "found", list.length);
  return list;
}

export async function expandSeedsAutocomplete(seeds, maxSeeds = 6) {
  const limited = seeds.slice(0, maxSeeds);
  const all = new Set();

  for (const seed of limited) {
    const expanded = await expandKeywordWithAlphabet(seed);
    expanded.forEach((k) => all.add(k));
  }

  return [...all];
}
