import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";

async function getProjectAccess(supabase, user, admin, projectId) {
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", projectId)
    .single();

  if (error || !project) return { project: null, allowed: false };
  if (admin || project.user_id === user.id) return { project, allowed: true };
  return { project, allowed: false };
}

export async function PATCH(request, { params }) {
  const { id: projectId, todoId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { allowed } = await getProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const body = await request.json();
  const updates = { updated_at: new Date().toISOString() };

  if (body.title !== undefined) {
    const trimmed = String(body.title).trim();
    if (!trimmed) return NextResponse.json({ error: "Todo metni boş olamaz" }, { status: 400 });
    updates.title = trimmed;
  }

  if (body.is_completed !== undefined) {
    updates.is_completed = Boolean(body.is_completed);
  }

  if (body.is_archived !== undefined) {
    updates.is_archived = Boolean(body.is_archived);

    if (body.is_archived === true) {
      updates.is_later = false;
    }

    if (body.is_archived === false) {
      updates.is_later = false;
      const { data: lastTodo } = await supabase
        .from("project_todos")
        .select("sort_order")
        .eq("project_id", projectId)
        .eq("is_archived", false)
        .eq("is_later", false)
        .eq("is_deleted", false)
        .neq("id", todoId)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();

      updates.sort_order = (lastTodo?.sort_order ?? -1) + 1;
    }
  }

  if (body.is_later !== undefined) {
    updates.is_later = Boolean(body.is_later);

    if (body.is_later === true) {
      updates.is_archived = false;
    }

    if (body.is_later === false) {
      const { data: lastTodo } = await supabase
        .from("project_todos")
        .select("sort_order")
        .eq("project_id", projectId)
        .eq("is_archived", false)
        .eq("is_later", false)
        .eq("is_deleted", false)
        .neq("id", todoId)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();

      updates.sort_order = (lastTodo?.sort_order ?? -1) + 1;
    }
  }

  if (body.color !== undefined) {
    const allowedColors = ["blue", "amber", "rose"];
    if (body.color === null || body.color === "") {
      updates.color = null;
    } else if (allowedColors.includes(body.color)) {
      updates.color = body.color;
    } else {
      return NextResponse.json({ error: "Geçersiz renk" }, { status: 400 });
    }
  }

  const { data, error } = await supabase
    .from("project_todos")
    .update(updates)
    .eq("id", todoId)
    .eq("project_id", projectId)
    .eq("is_deleted", false)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Todo bulunamadı" }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(request, { params }) {
  const { id: projectId, todoId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { allowed } = await getProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("project_todos")
    .update({ is_deleted: true, deleted_at: now, updated_at: now })
    .eq("id", todoId)
    .eq("project_id", projectId)
    .eq("is_deleted", false)
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Todo bulunamadı" }, { status: 404 });
  return NextResponse.json({ success: true });
}
