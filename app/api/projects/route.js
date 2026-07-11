import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

export async function GET() {
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  let query = supabase
    .from("projects")
    .select("*")
    .eq("is_archived", false)
    .order("is_favorited", { ascending: false })
    .order("created_at", { ascending: false });

  if (!admin) {
    query = query.eq("user_id", user.id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { name, type } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Proje adı gerekli" }, { status: 400 });
  }

  const allowedTypes = ["landing_page", "saas", "mobile_app"];
  const projectType = allowedTypes.includes(type) ? type : "landing_page";

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      name: name.trim(),
      user_id: user.id,
      update_public_token: nanoid(32),
      type: projectType,
    })
    .select()
    .single();

  if (projectError) {
    return NextResponse.json({ error: projectError.message }, { status: 500 });
  }

  const token = nanoid(32);
  await supabase.from("installation_forms").insert({
    project_id: project.id,
    public_token: token,
  });

  await supabase.from("site_settings").insert({ project_id: project.id });

  return NextResponse.json(project, { status: 201 });
}
