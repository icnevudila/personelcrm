import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

async function fetchVercelProjects(token, teamId) {
  let url = "https://api.vercel.com/v9/projects?limit=100";
  if (teamId) url += `&teamId=${teamId}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Vercel API error: ${res.status}`);
  const data = await res.json();
  return data.projects || [];
}

async function fetchLatestDeployment(token, teamId, projectId) {
  let url = `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=1&target=production`;
  if (teamId) url += `&teamId=${teamId}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.deployments?.[0] || null;
  } catch {
    return null;
  }
}

function mapState(state) {
  switch (state) {
    case "READY": return "active";
    case "ERROR": return "error";
    case "BUILDING": return "building";
    case "CANCELED": return "canceled";
    case "QUEUED": return "queued";
    default: return "unknown";
  }
}

export async function POST() {
  try {
    const supabase = await createClient();
    const { user } = await getCurrentUser(supabase);
    if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    const token = process.env.VERCEL_TOKEN;
    if (!token) return NextResponse.json({ error: "VERCEL_TOKEN eksik" }, { status: 400 });
    const teamId = process.env.VERCEL_TEAM_ID || null;

    // Fetch all Vercel projects
    const vercelProjects = await fetchVercelProjects(token, teamId);

    // Get all DB projects
    const { data: dbProjects, error: dbErr } = await supabase
      .from("projects")
      .select("id, name, vercel_project_id")
      .eq("is_archived", false);

    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

    const results = [];

    for (const vp of vercelProjects) {
      // Match by vercel_project_id or by name
      const dbProject = dbProjects.find(
        (p) => p.vercel_project_id === vp.id || p.name.toLowerCase() === vp.name.toLowerCase()
      );

      // Fetch latest deployment for this vercel project
      const latestDeploy = await fetchLatestDeployment(token, teamId, vp.id);

      // Figure out URLs
      const aliases = vp.targets?.production?.alias || [];
      const vercelUrl = vp.targets?.production?.url
        ? `https://${vp.targets.production.url}`
        : null;

      const customDomain = aliases.find(
        (a) => !a.includes(".vercel.app") && !a.includes(".now.sh")
      );
      const vercelDomain = aliases.find(
        (a) => a.includes(".vercel.app") || a.includes(".now.sh")
      ) || (vercelUrl ? vp.targets?.production?.url : null);

      const deployStatus = latestDeploy
        ? mapState(latestDeploy.state)
        : (vp.targets?.production ? "active" : "unknown");

      const lastDeployedAt = latestDeploy?.createdAt
        ? new Date(latestDeploy.createdAt).toISOString()
        : null;

      const gitMeta = latestDeploy?.meta || {};
      const commitMessage = gitMeta.githubCommitMessage || gitMeta.gitlabCommitMessage || null;
      const commitSha = (gitMeta.githubCommitSha || gitMeta.gitlabCommitSha || "").slice(0, 7);
      const branch = gitMeta.githubCommitRef || gitMeta.gitlabCommitRef || null;

      // Update DB project if matched
      if (dbProject) {
        await supabase
          .from("projects")
          .update({
            vercel_project_id: vp.id,
            vercel_url: vercelUrl || (vercelDomain ? `https://${vercelDomain}` : null),
            custom_domain: customDomain ? `https://${customDomain}` : null,
            live_url: customDomain
              ? `https://${customDomain}`
              : vercelUrl || (vercelDomain ? `https://${vercelDomain}` : null),
            deployment_status: deployStatus,
            last_deployed_at: lastDeployedAt,
          })
          .eq("id", dbProject.id);
      }

      results.push({
        vercel_id: vp.id,
        name: vp.name,
        db_project_id: dbProject?.id || null,
        vercel_url: vercelUrl,
        custom_domain: customDomain ? `https://${customDomain}` : null,
        vercel_domain: vercelDomain ? `https://${vercelDomain}` : null,
        deployment_status: deployStatus,
        last_deployed_at: lastDeployedAt,
        commit_message: commitMessage,
        commit_sha: commitSha,
        branch,
        framework: vp.framework || null,
        node_version: vp.nodeVersion || null,
        region: latestDeploy?.regions?.[0] || null,
        build_time_ms: latestDeploy?.buildingAt && latestDeploy?.ready
          ? latestDeploy.ready - latestDeploy.buildingAt
          : null,
      });
    }

    return NextResponse.json({ success: true, count: results.length, projects: results });
  } catch (err) {
    console.error("[vercel-status]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  // Returns current DB state without re-fetching Vercel
  try {
    const supabase = await createClient();
    const { user } = await getCurrentUser(supabase);
    if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    const { data, error } = await supabase
      .from("projects")
      .select("id, name, vercel_project_id, vercel_url, custom_domain, live_url, deployment_status, last_deployed_at")
      .eq("is_archived", false)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ projects: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
