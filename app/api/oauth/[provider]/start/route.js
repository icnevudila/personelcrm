import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { getOrCreatePersonalWorkspace } from "@/lib/automation/workspace";
import { createAuthorizationUrl } from "@/lib/social/oauth";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  const { provider } = await params;
  if (!["x", "instagram"].includes(provider)) return NextResponse.json({ error: "Bilinmeyen OAuth sağlayıcısı." }, { status: 404 });
  const supabase = await createClient(); const { user } = await getCurrentUser(supabase);
  if (!user) return NextResponse.redirect(new URL("/login", process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  try {
    const workspace = await getOrCreatePersonalWorkspace(user);
    return NextResponse.redirect(await createAuthorizationUrl({ provider, workspaceId: workspace.id, userId: user.id }));
  } catch (error) {
    return NextResponse.redirect(new URL(`/dashboard/social?connection_error=${encodeURIComponent(error.message)}`, process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  }
}
