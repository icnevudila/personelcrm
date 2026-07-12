import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { generateApiKey } from "@/lib/mcp/auth";
import crypto from "crypto";

export const runtime = "nodejs";

// GET — list user's API keys
export async function GET() {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data, error } = await supabase
    .from("user_api_keys")
    .select("id, name, key_prefix, last_used_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ keys: data });
}

// POST — create a new API key
export async function POST(request) {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const name = (body.name || "API Key").trim().slice(0, 64);

  const { key, prefix, hash } = generateApiKey();

  const { data, error } = await supabase
    .from("user_api_keys")
    .insert({ user_id: user.id, name, key_hash: hash, key_prefix: prefix })
    .select("id, name, key_prefix, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Return the plain key ONCE — never stored again
  return NextResponse.json({ key, meta: data });
}

// DELETE — revoke a key
export async function DELETE(request) {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (!body.id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  const { error } = await supabase
    .from("user_api_keys")
    .delete()
    .eq("id", body.id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
