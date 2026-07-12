import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

function db(userId) {
  const supabase = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  return { supabase, userId };
}

// ─── Tool Definitions ───────────────────────────────────────────────────────

export const TOOL_DEFINITIONS = [
  {
    name: "list_projects",
    description: "List all projects in AI Product OS. Returns id, name, description, type, status, live_url, deployment_status.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_project",
    description: "Get full details of a project by id or name.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Project UUID" },
        name: { type: "string", description: "Project name (partial match ok)" },
      },
    },
  },
  {
    name: "get_todos",
    description: "Get open todos for a project.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Project UUID" },
      },
      required: ["project_id"],
    },
  },
  {
    name: "add_todo",
    description: "Add a new todo item to a project.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string" },
        title: { type: "string", description: "Todo title" },
        color: { type: "string", enum: ["blue", "amber", "rose"], description: "Optional color tag" },
      },
      required: ["project_id", "title"],
    },
  },
  {
    name: "complete_todo",
    description: "Mark a todo as completed.",
    inputSchema: {
      type: "object",
      properties: {
        todo_id: { type: "string", description: "Todo UUID" },
      },
      required: ["todo_id"],
    },
  },
  {
    name: "update_blueprint",
    description: "Update a field in the product blueprint (problem, solution, value_proposition, target_audience, short_description).",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string" },
        field: {
          type: "string",
          enum: ["problem", "solution", "value_proposition", "target_audience", "short_description"],
        },
        value: { type: "string" },
      },
      required: ["project_id", "field", "value"],
    },
  },
  {
    name: "add_feature",
    description: "Add a feature to the project blueprint.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        priority: { type: "string", enum: ["low", "medium", "high"] },
        is_mvp: { type: "boolean" },
      },
      required: ["project_id", "title"],
    },
  },
  {
    name: "update_db_schema",
    description: "Update the database schema for a project. Provide tables with columns and relationships.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string" },
        schema: {
          type: "object",
          description: "Schema object with tables array: { tables: [{ name, columns: [{ name, type, isPk }] }] }",
        },
        notes: { type: "string", description: "Optional notes about the schema change" },
      },
      required: ["project_id", "schema"],
    },
  },
  {
    name: "add_update",
    description: "Publish a project update (changelog entry). Use this after significant changes.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string" },
        title: { type: "string", description: "Update title" },
        content: { type: "string", description: "Update content in markdown" },
        type: {
          type: "string",
          enum: ["feature", "fix", "improvement", "deploy", "note"],
          description: "Type of update",
        },
      },
      required: ["project_id", "title", "content"],
    },
  },
  {
    name: "set_live_url",
    description: "Set or update the live/production URL for a project.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string" },
        live_url: { type: "string", description: "Full URL including https://" },
        vercel_url: { type: "string", description: "Vercel .vercel.app URL if different from live" },
        custom_domain: { type: "string", description: "Custom domain if set" },
      },
      required: ["project_id", "live_url"],
    },
  },
  {
    name: "update_tech_stack",
    description: "Add or update a technology in the project tech stack.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string" },
        name: { type: "string", description: "Technology name e.g. Next.js, Supabase, Stripe" },
        category: {
          type: "string",
          enum: ["frontend", "backend", "database", "auth", "payment", "infra", "ai", "other"],
        },
        reason: { type: "string", description: "Why this tech was chosen" },
      },
      required: ["project_id", "name", "category"],
    },
  },
  {
    name: "add_competitor",
    description: "Add a competitor to the project blueprint.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string" },
        name: { type: "string" },
        url: { type: "string" },
        notes: { type: "string" },
      },
      required: ["project_id", "name"],
    },
  },
  {
    name: "update_marketing",
    description: "Update marketing blueprint fields (target_audience, positioning, key_message, channels).",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string" },
        field: {
          type: "string",
          enum: ["target_audience", "positioning", "key_message", "launch_goal"],
        },
        value: { type: "string" },
      },
      required: ["project_id", "field", "value"],
    },
  },
];

// ─── Tool Handlers ───────────────────────────────────────────────────────────

async function resolveProject(supabase, userId, { project_id, name }) {
  if (project_id) {
    const { data } = await supabase.from("projects").select("*").eq("id", project_id).single();
    return data;
  }
  if (name) {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .ilike("name", `%${name}%`)
      .limit(1)
      .single();
    return data;
  }
  return null;
}

async function ensureBlueprint(supabase, projectId) {
  const { data: existing } = await supabase
    .from("project_blueprints")
    .select("id")
    .eq("project_id", projectId)
    .maybeSingle();
  if (existing) return existing.id;
  const { data } = await supabase
    .from("project_blueprints")
    .insert({ project_id: projectId })
    .select("id")
    .single();
  return data.id;
}

async function ensureMarketing(supabase, projectId) {
  const { data: existing } = await supabase
    .from("marketing_blueprints")
    .select("id")
    .eq("project_id", projectId)
    .maybeSingle();
  if (existing) return existing.id;
  const { data } = await supabase
    .from("marketing_blueprints")
    .insert({ project_id: projectId })
    .select("id")
    .single();
  return data.id;
}

export async function executeTool(toolName, args, userId) {
  const { supabase } = db(userId);

  switch (toolName) {
    case "list_projects": {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, description, type, status, live_url, vercel_url, custom_domain, deployment_status, last_deployed_at")
        .eq("is_archived", false)
        .order("is_favorited", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return { projects: data, count: data.length };
    }

    case "get_project": {
      const project = await resolveProject(supabase, userId, args);
      if (!project) return { error: "Project not found" };
      // Also fetch blueprint and todos summary
      const [{ data: bp }, { data: todos }] = await Promise.all([
        supabase.from("project_blueprints").select("*").eq("project_id", project.id).maybeSingle(),
        supabase.from("project_todos").select("id, title, is_completed").eq("project_id", project.id).eq("is_deleted", false).limit(10),
      ]);
      return { project, blueprint: bp, recent_todos: todos };
    }

    case "get_todos": {
      const { data, error } = await supabase
        .from("project_todos")
        .select("id, title, is_completed, color, created_at")
        .eq("project_id", args.project_id)
        .eq("is_deleted", false)
        .eq("is_archived", false)
        .order("sort_order");
      if (error) throw new Error(error.message);
      return { todos: data, open: data.filter((t) => !t.is_completed).length };
    }

    case "add_todo": {
      const { data: last } = await supabase
        .from("project_todos")
        .select("sort_order")
        .eq("project_id", args.project_id)
        .eq("is_deleted", false)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      const { data, error } = await supabase
        .from("project_todos")
        .insert({
          project_id: args.project_id,
          title: args.title.trim(),
          color: args.color || null,
          sort_order: (last?.sort_order ?? -1) + 1,
        })
        .select("id, title")
        .single();
      if (error) throw new Error(error.message);
      return { ok: true, todo: data };
    }

    case "complete_todo": {
      const { data, error } = await supabase
        .from("project_todos")
        .update({ is_completed: true, updated_at: new Date().toISOString() })
        .eq("id", args.todo_id)
        .select("id, title")
        .single();
      if (error) throw new Error(error.message);
      return { ok: true, todo: data };
    }

    case "update_blueprint": {
      const allowed = ["problem", "solution", "value_proposition", "target_audience", "short_description"];
      if (!allowed.includes(args.field)) throw new Error(`Invalid field: ${args.field}`);
      await ensureBlueprint(supabase, args.project_id);
      const { error } = await supabase
        .from("project_blueprints")
        .update({ [args.field]: args.value.trim(), updated_at: new Date().toISOString() })
        .eq("project_id", args.project_id);
      if (error) throw new Error(error.message);
      return { ok: true, field: args.field };
    }

    case "add_feature": {
      const blueprintId = await ensureBlueprint(supabase, args.project_id);
      const { data: last } = await supabase
        .from("blueprint_features")
        .select("sort_order")
        .eq("blueprint_id", blueprintId)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      const { data, error } = await supabase
        .from("blueprint_features")
        .insert({
          blueprint_id: blueprintId,
          title: args.title.trim(),
          description: (args.description || "").trim(),
          priority: ["low", "medium", "high"].includes(args.priority) ? args.priority : "medium",
          is_mvp: args.is_mvp ?? false,
          sort_order: (last?.sort_order ?? -1) + 1,
        })
        .select("id, title")
        .single();
      if (error) throw new Error(error.message);
      return { ok: true, feature: data };
    }

    case "update_db_schema": {
      const { data: existing } = await supabase
        .from("project_db_schemas")
        .select("id")
        .eq("project_id", args.project_id)
        .maybeSingle();
      const note = args.notes ? `\n\nNot: ${args.notes}` : "";
      if (existing) {
        await supabase
          .from("project_db_schemas")
          .update({ schema_data: args.schema, updated_at: new Date().toISOString() })
          .eq("project_id", args.project_id);
      } else {
        await supabase.from("project_db_schemas").insert({
          project_id: args.project_id,
          schema_data: args.schema,
          project_context: note,
        });
      }
      return { ok: true, tables: args.schema?.tables?.length ?? 0 };
    }

    case "add_update": {
      const typeMap = { feature: "🚀", fix: "🐛", improvement: "✨", deploy: "🌐", note: "📝" };
      const emoji = typeMap[args.type] || "📝";
      const { data, error } = await supabase
        .from("update_requests")
        .insert({
          project_id: args.project_id,
          title: `${emoji} ${args.title.trim()}`,
          content: args.content.trim(),
          status: "published",
          published_at: new Date().toISOString(),
        })
        .select("id, title")
        .single();
      if (error) throw new Error(error.message);
      return { ok: true, update: data };
    }

    case "set_live_url": {
      const patch = {
        live_url: args.live_url,
        updated_at: new Date().toISOString(),
      };
      if (args.vercel_url) patch.vercel_url = args.vercel_url;
      if (args.custom_domain) patch.custom_domain = args.custom_domain;
      const { error } = await supabase.from("projects").update(patch).eq("id", args.project_id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }

    case "update_tech_stack": {
      const blueprintId = await ensureBlueprint(supabase, args.project_id);
      const { data: existing } = await supabase
        .from("blueprint_tech_stack")
        .select("id")
        .eq("blueprint_id", blueprintId)
        .ilike("name", args.name)
        .maybeSingle();
      if (existing) {
        await supabase
          .from("blueprint_tech_stack")
          .update({ category: args.category, reason: args.reason || "" })
          .eq("id", existing.id);
      } else {
        await supabase.from("blueprint_tech_stack").insert({
          blueprint_id: blueprintId,
          name: args.name.trim(),
          category: args.category,
          reason: args.reason || "",
        });
      }
      return { ok: true, tech: args.name };
    }

    case "add_competitor": {
      const blueprintId = await ensureBlueprint(supabase, args.project_id);
      const { data, error } = await supabase
        .from("blueprint_competitors")
        .insert({
          blueprint_id: blueprintId,
          name: args.name.trim(),
          url: args.url || "",
          notes: args.notes || "",
        })
        .select("id, name")
        .single();
      if (error) throw new Error(error.message);
      return { ok: true, competitor: data };
    }

    case "update_marketing": {
      const allowed = ["target_audience", "positioning", "key_message", "launch_goal"];
      if (!allowed.includes(args.field)) throw new Error(`Invalid field: ${args.field}`);
      await ensureMarketing(supabase, args.project_id);
      const { error } = await supabase
        .from("marketing_blueprints")
        .update({ [args.field]: args.value.trim(), updated_at: new Date().toISOString() })
        .eq("project_id", args.project_id);
      if (error) throw new Error(error.message);
      return { ok: true, field: args.field };
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
