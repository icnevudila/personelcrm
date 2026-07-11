import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { omitInstallationPages } from "@/lib/sitePages";
import { replaceSitePages } from "@/lib/replaceSitePages";

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
  const { token } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("installation_forms")
    .select("*")
    .eq("public_token", token)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Form bulunamadı" }, { status: 404 });
  }

  let sitePages;
  try {
    sitePages = await fetchSitePages(supabase, data.project_id);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }

  return NextResponse.json(mergeFormResponse(data, sitePages));
}

export async function PUT(request, { params }) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: form } = await supabase
    .from("installation_forms")
    .select("id, is_completed, project_id")
    .eq("public_token", token)
    .single();

  if (!form) return NextResponse.json({ error: "Form bulunamadı" }, { status: 404 });

  const body = await request.json();
  const pagesPayload = Object.prototype.hasOwnProperty.call(body, "pages") ? body.pages : undefined;
  const { pages: _p, site_pages: _s, ...rest } = body;

  const { data, error } = await supabase
    .from("installation_forms")
    .update(rest)
    .eq("public_token", token)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (pagesPayload !== undefined) {
    try {
      await replaceSitePages(supabase, form.project_id, pagesPayload);
    } catch (e) {
      return NextResponse.json({ error: e.message || "Sayfalar kaydedilemedi" }, { status: 500 });
    }
  }

  let sitePages;
  try {
    sitePages = await fetchSitePages(supabase, form.project_id);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }

  return NextResponse.json(mergeFormResponse(data, sitePages));
}
