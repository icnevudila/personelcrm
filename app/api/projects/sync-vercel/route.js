import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

export async function POST() {
  try {
    const supabase = await createClient();
    const { user, admin } = await getCurrentUser(supabase);
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const token = process.env.VERCEL_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "VERCEL_TOKEN çevre değişkeni tanımlı değil." },
        { status: 400 }
      );
    }

    const teamId = process.env.VERCEL_TEAM_ID;
    let url = "https://api.vercel.com/v9/projects";
    if (teamId) {
      url += `?teamId=${teamId}`;
    }

    console.log("[Vercel Sync] Fetching projects from Vercel API...");
    const vercelRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!vercelRes.ok) {
      const errText = await vercelRes.text();
      console.error("[Vercel Sync] Vercel API error:", errText);
      return NextResponse.json(
        { error: `Vercel API hatası: ${vercelRes.statusText}` },
        { status: vercelRes.status }
      );
    }

    const data = await vercelRes.json();
    const vercelProjects = data.projects || [];
    console.log(`[Vercel Sync] Found ${vercelProjects.length} projects in Vercel.`);

    // Fetch existing projects in Supabase
    const { data: existingProjects, error: fetchError } = await supabase
      .from("projects")
      .select("name");

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const existingNames = new Set(existingProjects.map((p) => p.name.toLowerCase().trim()));
    const importedProjects = [];

    for (const vProj of vercelProjects) {
      const name = vProj.name.trim();
      if (existingNames.has(name.toLowerCase())) {
        // Project already exists, skip
        continue;
      }

      // Insert new project
      const { data: insertedProj, error: insertError } = await supabase
        .from("projects")
        .insert({
          name: name,
          user_id: user.id,
          update_public_token: nanoid(32),
          type: "landing_page", // Default type
        })
        .select()
        .single();

      if (insertError) {
        console.error(`[Vercel Sync] Error inserting project ${name}:`, insertError.message);
        continue;
      }

      // Create installation form and site settings
      await supabase.from("installation_forms").insert({
        project_id: insertedProj.id,
        public_token: nanoid(32),
      });

      await supabase.from("site_settings").insert({
        project_id: insertedProj.id,
      });

      importedProjects.push(insertedProj);
    }

    console.log(`[Vercel Sync] Successfully imported ${importedProjects.length} new projects.`);
    return NextResponse.json({
      success: true,
      importedCount: importedProjects.length,
      imported: importedProjects,
    });
  } catch (err) {
    console.error("[Vercel Sync] Exception:", err);
    return NextResponse.json({ error: err.message || "Sunucu hatası" }, { status: 500 });
  }
}
