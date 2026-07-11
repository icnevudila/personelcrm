import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { NextResponse } from "next/server";
import Papa from "papaparse";

const BATCH_SIZE = 200;

export async function POST(request, { params }) {
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);

  if (!user || !admin) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { id: groupId } = await params;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "CSV dosyası gerekli" }, { status: 400 });
  }

  const text = await file.text();
  const { data: rows, errors } = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (errors.length && !rows.length) {
    return NextResponse.json({ error: "CSV dosyası okunamadı" }, { status: 400 });
  }

  const customers = rows.map((row) => ({
    group_id: groupId,
    business_name: row.business_name || null,
    maps_url: row.maps_url || null,
    phone_number: row.phone_number || null,
    province: row.province || null,
    district: row.district || null,
    rating: row.rating ? parseFloat(row.rating) : null,
    review_count: row.review_count ? parseInt(row.review_count) : null,
  }));

  let inserted = 0;
  for (let i = 0; i < customers.length; i += BATCH_SIZE) {
    const batch = customers.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("crm_customers").insert(batch);
    if (error) {
      console.error("[crm/import] Insert error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    inserted += batch.length;
  }

  return NextResponse.json({ imported: inserted });
}
