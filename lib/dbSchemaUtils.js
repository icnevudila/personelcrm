export const COLUMN_TYPES = ["uuid", "text", "int4", "bool", "timestamptz", "jsonb"];

const SQL_TYPE_MAP = {
  uuid: "uuid",
  text: "text",
  int4: "integer",
  bool: "boolean",
  timestamptz: "timestamptz",
  jsonb: "jsonb",
};

export function emptySchemaData() {
  return { tables: [] };
}

export function defaultWelcomeMessage() {
  return {
    id: "welcome",
    role: "assistant",
    content:
      "Merhaba! Projenizi anlatarak başlayabilirsiniz — sektör, kullanıcı tipleri, ihtiyaç duyulan modüller gibi. Size uygun tablo ve ilişki tasarımını önereceğim. Değişiklikler kaydedilene kadar yalnızca taslak olarak kalır.",
  };
}

export function cloneSchemaData(schemaData) {
  return JSON.parse(JSON.stringify(schemaData || emptySchemaData()));
}

export function normalizeTables(rawTables) {
  if (!Array.isArray(rawTables)) return [];
  return rawTables.map((table, tableIndex) => ({
    id: String(table.id || `t_${tableIndex}`),
    name: String(table.name || "new_table")
      .trim()
      .replace(/\s+/g, "_")
      .toLowerCase(),
    x: Number(table.x) || 80 + tableIndex * 40,
    y: Number(table.y) || 80 + tableIndex * 30,
    columns: Array.isArray(table.columns)
      ? table.columns.map((col, colIndex) => ({
          id: String(col.id || `c_${tableIndex}_${colIndex}`),
          name: String(col.name || "field")
            .trim()
            .replace(/\s+/g, "_")
            .toLowerCase(),
          type: COLUMN_TYPES.includes(col.type) ? col.type : "text",
          isPk: Boolean(col.isPk),
          fkRef:
            col.fkRef?.tableId && col.fkRef?.column
              ? { tableId: String(col.fkRef.tableId), column: String(col.fkRef.column) }
              : undefined,
        }))
      : [{ id: "id", name: "id", type: "uuid", isPk: true }],
  }));
}

export function generateSupabaseSql(tables) {
  const normalized = normalizeTables(tables);
  if (!normalized.length) {
    return "-- Henüz tablo yok.\n";
  }

  const lines = ['create extension if not exists "uuid-ossp";', ""];

  for (const table of normalized) {
    const colLines = [];
    const pkCols = table.columns.filter((c) => c.isPk).map((c) => c.name);
    const inlineFks = new Set();

    for (const col of table.columns) {
      const sqlType = SQL_TYPE_MAP[col.type] || "text";
      let def = `  ${col.name} ${sqlType}`;

      if (col.isPk && col.type === "uuid" && pkCols.length === 1) {
        def += " primary key default uuid_generate_v4()";
      } else if (col.isPk && pkCols.length === 1) {
        def += " primary key";
      }

      if (col.fkRef) {
        const target = normalized.find((t) => t.id === col.fkRef.tableId);
        if (target) {
          def += ` references ${target.name}(${col.fkRef.column}) on delete cascade`;
          inlineFks.add(col.name);
        }
      }

      if (!col.isPk && col.name === "created_at" && col.type === "timestamptz") {
        def += " default now()";
      }

      colLines.push(def);
    }

    if (pkCols.length > 1) {
      colLines.push(`  primary key (${pkCols.join(", ")})`);
    }

    lines.push(`create table ${table.name} (`);
    lines.push(colLines.join(",\n"));
    lines.push(");");
    lines.push("");
  }

  return lines.join("\n");
}

export function buildDraftFingerprint({ schemaData, chatMessages, projectContext }) {
  return JSON.stringify({
    schemaData: schemaData || emptySchemaData(),
    chatMessages: chatMessages || [],
    projectContext: projectContext || "",
  });
}
