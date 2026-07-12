import crypto from "crypto";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

function getAdminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function generateApiKey() {
  const raw = crypto.randomBytes(32).toString("hex");
  const key = `apos_${raw}`; // AI Product OS prefix
  const prefix = key.slice(0, 12); // "apos_" + 7 chars
  const hash = crypto.createHash("sha256").update(key).digest("hex");
  return { key, prefix, hash };
}

export async function validateApiKey(authHeader) {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const key = authHeader.slice(7).trim();
  if (!key.startsWith("apos_")) return null;

  const hash = crypto.createHash("sha256").update(key).digest("hex");
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("user_api_keys")
    .select("id, user_id, name")
    .eq("key_hash", hash)
    .single();

  if (error || !data) return null;

  // Update last_used_at asynchronously (don't await)
  supabase
    .from("user_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id)
    .then(() => {});

  return { userId: data.user_id, keyId: data.id, keyName: data.name };
}
