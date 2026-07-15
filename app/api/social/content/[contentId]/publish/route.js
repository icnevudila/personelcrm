import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { getOrCreatePersonalWorkspace } from "@/lib/automation/workspace";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptJson } from "@/lib/automation/crypto";
import { audit } from "@/lib/automation/persistence";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(_request, { params }) {
  const db = await createClient(); const { user } = await getCurrentUser(db);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { contentId } = await params;
  try {
    const workspace = await getOrCreatePersonalWorkspace(user);
    const { data: content, error } = await db.from("content_items").select("*").eq("id", contentId).eq("workspace_id", workspace.id).single();
    if (error || !content) return NextResponse.json({ error: "İçerik bulunamadı." }, { status: 404 });
    if (content.status === "published") return NextResponse.json({ error: "Bu içerik zaten yayınlandı." }, { status: 409 });
    const admin = createAdminClient();
    const { data: account, error: accountError } = await admin.from("social_accounts").select("id,provider,external_account_id,oauth_connection_id,status").eq("workspace_id", workspace.id).eq("provider", content.platform).eq("status", "connected").not("oauth_connection_id", "is", null).limit(1).maybeSingle();
    if (accountError || !account) return NextResponse.json({ error: `${content.platform === "x" ? "X" : "Instagram"} hesabı bağlı değil veya yeniden bağlanmalı.` }, { status: 422 });
    const { data: claimed } = await admin.from("content_items").update({ status: "publishing" }).eq("id", content.id).in("status", ["draft", "approved", "scheduled", "failed"]).select("id").maybeSingle();
    if (!claimed) return NextResponse.json({ error: "İçerik şu anda başka bir yayın denemesi tarafından işleniyor." }, { status: 409 });
    const { data: connection, error: connectionError } = await admin.from("oauth_connections").select("encrypted_payload,status").eq("id", account.oauth_connection_id).eq("status", "connected").single();
    if (connectionError) throw connectionError;
    const result = content.platform === "x" ? await publishX({ content, account, tokens: decryptJson(connection.encrypted_payload) }) : await publishInstagram({ content, account, tokens: decryptJson(connection.encrypted_payload) });
    await admin.from("social_posts").upsert({ workspace_id: workspace.id, content_item_id: content.id, social_account_id: account.id, provider: content.platform, external_id: result.externalId, external_url: result.url || null, provider_response: result.response }, { onConflict: "content_item_id,provider" });
    await admin.from("content_items").update({ status: "published", published_at: new Date().toISOString(), external_id: result.externalId }).eq("id", content.id);
    await audit({ workspaceId: workspace.id, actorId: user.id, action: "social.content_published", entityType: "content_item", entityId: content.id, metadata: { provider: content.platform, externalId: result.externalId } });
    return NextResponse.json({ published: true, post: { id: result.externalId, url: result.url || null } });
  } catch (error) {
    const admin = createAdminClient();
    await admin.from("content_items").update({ status: "failed" }).eq("id", contentId);
    return NextResponse.json({ error: error.message || "Yayınlama başarısız oldu." }, { status: 502 });
  }
}

async function publishX({ content, account, tokens }) {
  const text = String(content.body?.text || content.title || "").trim();
  if (!text) throw new Error("X postu için metin zorunludur.");
  if (text.length > 280) throw new Error("X postu 280 karakteri aşamaz.");
  const response = await fetch("https://api.x.com/2/tweets", { method: "POST", headers: { Authorization: `Bearer ${tokens.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.data?.id) throw new Error(`X yayınlama isteği başarısız oldu: ${data.detail || data.errors?.[0]?.detail || response.status}`);
  return { externalId: data.data.id, url: account.external_account_id ? `https://x.com/i/web/status/${data.data.id}` : null, response: data };
}

async function publishInstagram({ content, account, tokens }) {
  const imageUrl = content.body?.imageUrl;
  if (!imageUrl || !/^https:\/\//.test(imageUrl)) throw new Error("Instagram yayınlamak için body.imageUrl içinde HTTPS ile erişilebilen görsel URL zorunludur.");
  const version = process.env.META_GRAPH_VERSION || "v23.0";
  const create = await fetch(`https://graph.facebook.com/${version}/${account.external_account_id}/media`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ image_url: imageUrl, caption: String(content.body?.text || content.title || ""), access_token: tokens.access_token }) });
  const container = await create.json().catch(() => ({}));
  if (!create.ok || !container.id) throw new Error(`Instagram medya container oluşturulamadı: ${container.error?.message || create.status}`);
  const publish = await fetch(`https://graph.facebook.com/${version}/${account.external_account_id}/media_publish`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ creation_id: container.id, access_token: tokens.access_token }) });
  const data = await publish.json().catch(() => ({}));
  if (!publish.ok || !data.id) throw new Error(`Instagram yayınlama isteği başarısız oldu: ${data.error?.message || publish.status}`);
  return { externalId: data.id, url: null, response: { container, publish: data } };
}
