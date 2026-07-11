import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { defaultWelcomeMessage, emptySchemaData } from "@/lib/dbSchemaUtils";

async function getProjectAccess(supabase, user, admin, projectId) {
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, name, user_id")
    .eq("id", projectId)
    .single();

  if (error || !project) return { project: null, allowed: false };
  if (admin || project.user_id === user.id) return { project, allowed: true };
  return { project, allowed: false };
}

export async function GET(request, { params }) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { allowed } = await getProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const { data, error } = await supabase
    .from("project_db_schemas")
    .select("project_context, schema_data, chat_messages, updated_at")
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!data) {
    return NextResponse.json({
      project_context: "",
      schema_data: emptySchemaData(),
      chat_messages: [defaultWelcomeMessage()],
      updated_at: null,
    });
  }

  return NextResponse.json({
    project_context: data.project_context || "",
    schema_data: data.schema_data || emptySchemaData(),
    chat_messages: data.chat_messages?.length ? data.chat_messages : [defaultWelcomeMessage()],
    updated_at: data.updated_at,
  });
}

export async function PUT(request, { params }) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { allowed } = await getProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  const row = {
    project_id: projectId,
    project_context: String(body.project_context || ""),
    schema_data: body.schema_data || emptySchemaData(),
    chat_messages: Array.isArray(body.chat_messages) ? body.chat_messages : [],
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("project_db_schemas")
    .upsert(row, { onConflict: "project_id" })
    .select("project_context, schema_data, chat_messages, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
