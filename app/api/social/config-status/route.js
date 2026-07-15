import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";

export const runtime = "nodejs";

export async function GET() {
  const db = await createClient();
  const { user } = await getCurrentUser(db);
  if (!user) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  return NextResponse.json({
    x_configured: Boolean(process.env.X_CLIENT_ID),
    meta_configured: Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET),
    groq_configured: Boolean(process.env.GROQ_API_KEY),
    gemini_configured: Boolean(process.env.GEMINI_API_KEY),
    app_url: process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "Tanımlanmamış",
    encryption_key: Boolean(process.env.CREDENTIAL_ENCRYPTION_KEY),
  });
}
