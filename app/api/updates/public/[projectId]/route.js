import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const MAX_UPDATE_REQUESTS = 10;

async function findProjectByToken(supabase, token) {
  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("update_public_token", token)
    .single();
  return project;
}

async function countActiveRequests(supabase, projectId) {
  const { count, error } = await supabase
    .from("update_requests")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .neq("status", "cancelled");
  if (error) throw error;
  return count || 0;
}

export async function GET(request, { params }) {
  const { projectId: token } = await params;
  const supabase = await createClient();

  const project = await findProjectByToken(supabase, token);

  if (!project) return NextResponse.json({ error: "Proje bulunamadı" }, { status: 404 });

  try {
    const activeCount = await countActiveRequests(supabase, project.id);
    const remaining = Math.max(0, MAX_UPDATE_REQUESTS - activeCount);

    const { data: sitePages, error: spErr } = await supabase
      .from("site_pages")
      .select("title, sort_order")
      .eq("project_id", project.id)
      .order("sort_order", { ascending: true });
    if (spErr) throw spErr;

    return NextResponse.json({
      project_id: project.id,
      project_name: project.name,
      max_requests: MAX_UPDATE_REQUESTS,
      active_request_count: activeCount,
      remaining_request_count: remaining,
      limit_reached: remaining <= 0,
      site_pages: sitePages || [],
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const { projectId: token } = await params;
  const supabase = await createClient();

  const project = await findProjectByToken(supabase, token);
  if (!project) return NextResponse.json({ error: "Proje bulunamadı" }, { status: 404 });

  const body = await request.json();
  const { title, pages, description, image_urls } = body;
  const normalizedPages = Array.isArray(pages) ? pages.filter(Boolean) : [];
  const allPagesSelected = normalizedPages.includes("Tüm Sayfalar");

  if (!title?.trim() || !description?.trim()) {
    return NextResponse.json({ error: "Başlık ve açıklama gerekli" }, { status: 400 });
  }
  if (!allPagesSelected && normalizedPages.length === 0) {
    return NextResponse.json({ error: "Tüm sayfalar veya en az bir sayfa seçilmelidir." }, { status: 400 });
  }

  try {
    const activeCount = await countActiveRequests(supabase, project.id);
    if (activeCount >= MAX_UPDATE_REQUESTS) {
      return NextResponse.json(
        { error: "Güncelleme talep hakkınız dolmuştur, lütfen yöneticiniz ile iletişime geçiniz." },
        { status: 403 }
      );
    }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  const { data: req, error } = await supabase
    .from("update_requests")
    .insert({
      project_id: project.id,
      title: title.trim(),
      pages: normalizedPages,
      description: description.trim(),
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
