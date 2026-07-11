import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { NextResponse } from "next/server";

export async function POST(request) {
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { project_id, domain } = await request.json();
  if (!project_id || !domain?.trim()) {
    return NextResponse.json({ error: "project_id ve domain gerekli" }, { status: 400 });
  }

  const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, "");

  if (/[çğıöşüÇĞİÖŞÜ]/.test(cleanDomain)) {
    return NextResponse.json({ error: "Domain Türkçe karakter içeremez" }, { status: 400 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("user_id")
    .eq("id", project_id)
    .single();

  if (!project) return NextResponse.json({ error: "Proje bulunamadı" }, { status: 404 });
  if (!admin && project.user_id !== user.id) {
    return NextResponse.json({ error: "Erişim yok" }, { status: 403 });
  }

  const { count } = await supabase
    .from("domains")
    .select("id", { count: "exact", head: true })
    .eq("project_id", project_id);

  const is_primary = count === 0;

  const { data, error } = await supabase
    .from("domains")
    .insert({ project_id, domain: cleanDomain, is_primary })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
