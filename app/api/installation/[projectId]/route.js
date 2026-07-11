import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { NextResponse } from "next/server";
import { omitInstallationPages } from "@/lib/sitePages";
import { replaceSitePages } from "@/lib/replaceSitePages";

async function checkAccess(supabase, user, admin, projectId) {
  const { data: project } = await supabase
    .from("projects")
    .select("user_id")
    .eq("id", projectId)
    .single();
  if (!project) return false;
  return admin || project.user_id === user.id;
}

async function fetchSitePages(supabase, projectId) {
  const { data, error } = await supabase
    .from("site_pages")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data || [];
}

function mergeFormResponse(formRow, sitePages) {
  const base = omitInstallationPages(formRow);
  return { ...base, site_pages: sitePages };
}

export async function GET(request, { params }) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const allowed = await checkAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const { data, error } = await supabase
    .from("installation_forms")
    .select("*")
    .eq("project_id", projectId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let sitePages;
  try {
    sitePages = await fetchSitePages(supabase, projectId);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }

  return NextResponse.json(mergeFormResponse(data, sitePages));
}

export async function PUT(request, { params }) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const allowed = await checkAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const body = await request.json();
  const pagesPayload = Object.prototype.hasOwnProperty.call(body, "pages") ? body.pages : undefined;
  const { pages: _p, site_pages: _s, ...rest } = body;

  const { data, error } = await supabase
    .from("installation_forms")
    .update(rest)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (pagesPayload !== undefined) {
    try {
      await replaceSitePages(supabase, projectId, pagesPayload);
    } catch (e) {
      return NextResponse.json({ error: e.message || "Sayfalar kaydedilemedi" }, { status: 500 });
    }
  }

  let sitePages;
  try {
    sitePages = await fetchSitePages(supabase, projectId);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }

  return NextResponse.json(mergeFormResponse(data, sitePages));
}
