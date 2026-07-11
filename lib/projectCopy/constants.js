export const COPY_TYPES = [
  { id: "slogan", label: "Slogan" },
  { id: "sales_copy", label: "Satış Metni" },
  { id: "tagline", label: "Tagline" },
  { id: "headline", label: "Başlık" },
];

export const COPY_TYPE_LABELS = Object.fromEntries(COPY_TYPES.map((t) => [t.id, t.label]));
