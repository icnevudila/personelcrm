import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

export async function POST(request) {
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await request.json();
  const { project_id } = body;
  console.log("[project-update-link] project_id:", project_id);

  if (!project_id) return NextResponse.json({ error: "project_id gerekli" }, { status: 400 });

  // Önce sadece user_id ile projeyi bul (migration çalışmamış olabilir)
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, user_id, update_public_token")
    .eq("id", project_id)
    .single();

  console.log("[project-update-link] project:", project, "error:", projectError);

  if (projectError || !project) {
    return NextResponse.json(
      { error: "Proje bulunamadı", detail: projectError?.message },
      { status: 404 }
    );
  }

  if (!admin && project.user_id !== user.id) {
    return NextResponse.json({ error: "Erişim yok" }, { status: 403 });
  }

  // update_public_token kolonu DB'de varsa kullan
  if (project.update_public_token) {
    console.log("[project-update-link] existing token returned");
    return NextResponse.json({ public_token: project.update_public_token });
  }

  // Kolon yoksa ya da null — token oluştur, hata olursa fallback
  const token = nanoid(32);
  const { error: updateError } = await supabase
    .from("projects")
    .update({ update_public_token: token })
    .eq("id", project_id);

  console.log("[project-update-link] updateError:", updateError);

  if (updateError) {
    // update_public_token kolonu DB'de henüz yoksa geçici token üret (migration beklemede)
    console.warn("[project-update-link] Kolon yok olabilir — geçici token kullanılıyor:", updateError.message);
    return NextResponse.json({ public_token: token, temporary: true });
  }

  return NextResponse.json({ public_token: token });
}
