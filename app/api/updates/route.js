import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { NextResponse } from "next/server";

export async function GET(request) {
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const project_id = searchParams.get("project_id");
  if (!project_id) return NextResponse.json({ error: "project_id gerekli" }, { status: 400 });

  const { data: project } = await supabase
    .from("projects")
    .select("user_id")
    .eq("id", project_id)
    .single();

  if (!project) return NextResponse.json({ error: "Proje bulunamadı" }, { status: 404 });
  if (!admin && project.user_id !== user.id) {
    return NextResponse.json({ error: "Erişim yok" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("update_requests")
    .select("*, update_request_images(*)")
    .eq("project_id", project_id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await request.json();
  const { project_id, title, pages, description, image_urls } = body;
  const normalizedPages = Array.isArray(pages) ? pages.filter(Boolean) : [];
  const allPagesSelected = normalizedPages.includes("Tüm Sayfalar");

  if (!project_id || !title?.trim() || !description?.trim()) {
    return NextResponse.json({ error: "project_id, başlık ve açıklama gerekli" }, { status: 400 });
  }
  if (!allPagesSelected && normalizedPages.length === 0) {
    return NextResponse.json({ error: "Tüm sayfalar veya en az bir sayfa seçilmelidir." }, { status: 400 });
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

  const { data: req, error } = await supabase
    .from("update_requests")
    .insert({
      project_id,
      title: title.trim(),
      pages: normalizedPages,
      description: description.trim(),
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (image_urls?.length) {
    await supabase.from("update_request_images").insert(
      image_urls.map((url) => ({ update_request_id: req.id, image_url: url }))
    );
  }

  return NextResponse.json(req, { status: 201 });
}
