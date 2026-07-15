import crypto from "node:crypto";
import { encryptJson, decryptJson } from "@/lib/automation/crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const X_SCOPES = ["tweet.read", "tweet.write", "users.read", "offline.access"];
const META_SCOPES = ["instagram_basic", "instagram_content_publish", "pages_show_list", "pages_read_engagement"];

function appUrl() { return (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, ""); }
function graphVersion() { return process.env.META_GRAPH_VERSION || "v23.0"; }
function hash(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
function random() { return crypto.randomBytes(32).toString("base64url"); }
function challenge(verifier) { return crypto.createHash("sha256").update(verifier).digest("base64url"); }

export function providerConfigured(provider) {
  if (!appUrl() || !process.env.CREDENTIAL_ENCRYPTION_KEY) return false;
  if (provider === "x") return Boolean(process.env.X_CLIENT_ID);
  if (provider === "instagram") return Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET);
  return false;
}

export function callbackUrl(provider) {
  const base = appUrl();
  if (!base) throw new Error("APP_URL veya NEXT_PUBLIC_APP_URL tanımlı değil.");
  return `${base}/api/oauth/${provider}/callback`;
}

export async function createAuthorizationUrl({ provider, workspaceId, userId }) {
  if (!providerConfigured(provider)) throw new Error(`${provider === "x" ? "X" : "Instagram"} OAuth yapılandırılmamış.`);
  const state = random(); const verifier = random(); const redirectUri = callbackUrl(provider);
  const db = createAdminClient();
  const { error } = await db.from("oauth_states").insert({ workspace_id: workspaceId, user_id: userId, provider, state_hash: hash(state), verifier_ciphertext: encryptJson({ verifier }), redirect_uri: redirectUri, expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() });
  if (error) throw error;
  if (provider === "x") {
    const params = new URLSearchParams({ response_type: "code", client_id: process.env.X_CLIENT_ID, redirect_uri: redirectUri, scope: X_SCOPES.join(" "), state, code_challenge: challenge(verifier), code_challenge_method: "S256" });
    return `https://x.com/i/oauth2/authorize?${params}`;
  }
  const params = new URLSearchParams({ client_id: process.env.META_APP_ID, redirect_uri: redirectUri, state, response_type: "code", scope: META_SCOPES.join(",") });
  return `https://www.facebook.com/${graphVersion()}/dialog/oauth?${params}`;
}

export async function completeAuthorization({ provider, state, code, currentUserId }) {
  const db = createAdminClient();
  const { data: row, error } = await db.from("oauth_states").select("*").eq("state_hash", hash(state)).eq("provider", provider).is("consumed_at", null).gt("expires_at", new Date().toISOString()).maybeSingle();
  if (error || !row || row.user_id !== currentUserId) throw new Error("OAuth state geçersiz, süresi dolmuş veya başka bir kullanıcıya ait.");
  const verifier = decryptJson(row.verifier_ciphertext).verifier;
  const account = provider === "x" ? await exchangeX(code, row.redirect_uri, verifier) : await exchangeInstagram(code, row.redirect_uri);
  const encryptedPayload = encryptJson(account.tokens);
  const { data: connection, error: connectionError } = await db.from("oauth_connections").upsert({ workspace_id: row.workspace_id, provider, external_account_id: account.id, display_name: account.name, encrypted_payload: encryptedPayload, scopes: account.scopes || [], status: "connected", expires_at: account.expiresAt || null, last_refreshed_at: new Date().toISOString(), last_error: null, created_by: currentUserId, updated_at: new Date().toISOString() }, { onConflict: "workspace_id,provider,external_account_id" }).select().single();
  if (connectionError) throw connectionError;
  const { error: accountError } = await db.from("social_accounts").upsert({ workspace_id: row.workspace_id, provider, external_account_id: account.id, display_name: account.name, status: "connected", oauth_connection_id: connection.id, expires_at: account.expiresAt || null }, { onConflict: "workspace_id,provider,external_account_id" });
  if (accountError) throw accountError;
  await db.from("oauth_states").update({ consumed_at: new Date().toISOString() }).eq("id", row.id).is("consumed_at", null);
  return { provider, account: { id: account.id, name: account.name } };
}

async function exchangeX(code, redirectUri, verifier) {
  const body = new URLSearchParams({ code, grant_type: "authorization_code", client_id: process.env.X_CLIENT_ID, redirect_uri: redirectUri, code_verifier: verifier });
  const response = await fetch("https://api.x.com/2/oauth2/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  const tokens = await readResponse(response, "X token");
  const me = await fetch("https://api.x.com/2/users/me", { headers: { Authorization: `Bearer ${tokens.access_token}` } });
  const profile = await readResponse(me, "X profile");
  if (!profile.data?.id) throw new Error("X hesabı kimliği alınamadı.");
  return { id: profile.data.id, name: profile.data.name || profile.data.username || profile.data.id, tokens, scopes: String(tokens.scope || "").split(" ").filter(Boolean), expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null };
}

async function exchangeInstagram(code, redirectUri) {
  const tokenParams = new URLSearchParams({ client_id: process.env.META_APP_ID, client_secret: process.env.META_APP_SECRET, redirect_uri: redirectUri, code });
  const tokenResponse = await fetch(`https://graph.facebook.com/${graphVersion()}/oauth/access_token?${tokenParams}`);
  const shortTokens = await readResponse(tokenResponse, "Meta token");
  const longResponse = await fetch(`https://graph.facebook.com/${graphVersion()}/oauth/access_token?${new URLSearchParams({ grant_type: "fb_exchange_token", client_id: process.env.META_APP_ID, client_secret: process.env.META_APP_SECRET, fb_exchange_token: shortTokens.access_token })}`);
  const tokens = longResponse.ok ? await longResponse.json() : shortTokens;
  const pagesResponse = await fetch(`https://graph.facebook.com/${graphVersion()}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${encodeURIComponent(tokens.access_token)}`);
  const pages = await readResponse(pagesResponse, "Instagram account");
  const page = pages.data?.find((item) => item.instagram_business_account?.id);
  if (!page?.instagram_business_account?.id) throw new Error("Yayınlanabilir bir Instagram Business veya Creator hesabı bulunamadı. Meta sayfası ve Instagram bağlantısını kontrol edin.");
  return { id: page.instagram_business_account.id, name: page.instagram_business_account.username || page.name || page.instagram_business_account.id, tokens: { ...tokens, access_token: page.access_token || tokens.access_token, page_id: page.id }, scopes: META_SCOPES, expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null };
}

async function readResponse(response, label) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${label} isteği başarısız oldu: ${data.error?.message || data.detail || response.status}`);
  return data;
}
