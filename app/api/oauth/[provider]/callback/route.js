import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { completeAuthorization } from "@/lib/social/oauth";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  const { provider } = await params;
  const url = new URL(request.url);
  const error = url.searchParams.get("error"); const state = url.searchParams.get("state"); const code = url.searchParams.get("code");
  const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || url.origin;
  if (error || !state || !code) return NextResponse.redirect(new URL(`/dashboard/social?connection_error=${encodeURIComponent(error || "OAuth onayı tamamlanmadı.")}`, baseUrl));
  const supabase = await createClient(); const { user } = await getCurrentUser(supabase);
  if (!user) return NextResponse.redirect(new URL("/login", baseUrl));
  try {
    await completeAuthorization({ provider, state, code, currentUserId: user.id });
    return NextResponse.redirect(new URL(`/dashboard/social?connected=${provider}`, baseUrl));
  } catch (cause) {
    return NextResponse.redirect(new URL(`/dashboard/social?connection_error=${encodeURIComponent(cause.message || "OAuth bağlantısı tamamlanamadı.")}`, baseUrl));
  }
}
