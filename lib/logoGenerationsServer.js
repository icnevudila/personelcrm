import { createClient } from "@/lib/supabase/server";

export async function getLogoProjectAccess(supabase, user, admin, projectId) {
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, name, user_id")
    .eq("id", projectId)
    .single();

  if (error || !project) return { project: null, allowed: false };
  if (admin || project.user_id === user.id) return { project, allowed: true };
  return { project, allowed: false };
}

export async function uploadBufferToPublicBucket({ supabase, bucket, buffer, path, contentType }) {
  const { data, error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: contentType || "image/png",
    upsert: true,
  });
  if (error) throw new Error(error.message);

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  if (!urlData?.publicUrl) throw new Error("Public URL alınamadı");

  return { publicUrl: urlData.publicUrl, storagePath: data.path };
}

export async function uploadPngBase64ToPublicBucket({ supabase, bucket, base64, path }) {
  const buffer = Buffer.from(base64, "base64");
  return uploadBufferToPublicBucket({
    supabase,
    bucket,
    buffer,
    path,
    contentType: "image/png",
  });
}

export const LOGO_BUCKET = "crm-logos";
