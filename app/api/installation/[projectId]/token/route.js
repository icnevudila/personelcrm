import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

/**
 * Proje için installation_forms kaydı yoksa oluştur, public_token döndür.
 */
export async function POST(request, { params }) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data: project } = await supabase
    .from("projects")
    .select("user_id")
    .eq("id", projectId)
    .single();

  if (!project) return NextResponse.json({ error: "Proje bulunamadı" }, { status: 404 });
  if (!admin && project.user_id !== user.id)
    return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  // Mevcut kaydı kontrol et
  const { data: existing } = await supabase
    .from("installation_forms")
    .select("public_token")
    .eq("project_id", projectId)
    .single();

  if (existing?.public_token) {
    return NextResponse.json({ public_token: existing.public_token });
  }

  // Kayıt yoksa yeni oluştur
  const token = nanoid(32);
  const { data, error } = await supabase
    .from("installation_forms")
    .insert({ project_id: projectId, public_token: token })
    .select("public_token")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ public_token: data.public_token });
}
