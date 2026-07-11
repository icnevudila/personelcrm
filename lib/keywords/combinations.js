export function buildGroupCombinations(groups) {
  if (!groups?.length) return [];

  let results = [""];

  for (const group of groups) {
    const items = (group.keyword_group_items || group.items || [])
      .map((i) => (i.value || i).trim())
      .filter(Boolean);

    if (items.length === 0) continue;

    const next = [];
    for (const prefix of results) {
      for (const item of items) {
        const combined = prefix ? `${prefix} ${item}` : item;
        next.push(combined.replace(/\s+/g, " ").trim());
      }
    }
    results = next;
  }

  return [...new Set(results.filter(Boolean))];
}

export function buildLocationKeywords(baseTerms, cities = [], districts = []) {
  const terms = baseTerms.map((t) => t.trim()).filter(Boolean);
  const out = new Set();

  for (const term of terms) {
    for (const city of cities) {
      const c = city.trim();
      if (!c) continue;
      out.add(`${c} ${term}`.toLowerCase());
      out.add(`${term} ${c}`.toLowerCase());
    }
    for (const district of districts) {
      const d = district.trim();
      if (!d) continue;
      out.add(`${d} ${term}`.toLowerCase());
      out.add(`${term} ${d}`.toLowerCase());
    }
  }

  return [...out];
}
