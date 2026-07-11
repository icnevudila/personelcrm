import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { emptyCanvasData } from "@/lib/roadmap/constants";
import { normalizeCanvasData } from "@/lib/roadmap/utils";

export async function GET() {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data, error } = await supabase
    .from("user_roadmaps")
    .select("canvas_data, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!data) {
    return NextResponse.json({
      canvas_data: emptyCanvasData(),
      updated_at: null,
    });
  }

  return NextResponse.json({
    canvas_data: normalizeCanvasData(data.canvas_data),
    updated_at: data.updated_at,
  });
}

export async function PUT(request) {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  const canvas_data = normalizeCanvasData(body.canvas_data || emptyCanvasData());

  const { data, error } = await supabase
    .from("user_roadmaps")
    .upsert(
      {
        user_id: user.id,
        canvas_data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select("canvas_data, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
