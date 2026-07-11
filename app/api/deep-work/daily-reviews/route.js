import { NextResponse } from "next/server";
import { requireDeepWorkUser } from "@/lib/deep-work/auth";
import { todayDateStr } from "@/lib/deep-work/dateUtils";

export async function GET(request) {
  const auth = await requireDeepWorkUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || todayDateStr();

  const { data, error } = await supabase
    .from("daily_reviews")
    .select("*")
    .eq("user_id", user.id)
    .eq("review_date", date)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request) {
  const auth = await requireDeepWorkUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;

  const body = await request.json();
  const reviewDate = body.review_date || todayDateStr();

  const row = {
    user_id: user.id,
    review_date: reviewDate,
    today_summary: String(body.today_summary || "").trim(),
    tomorrow_first_task: String(body.tomorrow_first_task || "").trim(),
    notes: String(body.notes || "").trim(),
  };

  const { data, error } = await supabase
    .from("daily_reviews")
    .upsert(row, { onConflict: "user_id,review_date" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
