import { uploadBufferToPublicBucket } from "@/lib/logoGenerationsServer";

export const COPYFAST_BUCKET = "crm-copyfast";

export function sanitizeFileName(name) {
  const ext = name.lastIndexOf(".") !== -1 ? name.slice(name.lastIndexOf(".")) : "";
  const base = name.slice(0, name.length - ext.length);
  return (
    base
      .replace(/ğ/g, "g").replace(/Ğ/g, "G")
      .replace(/ü/g, "u").replace(/Ü/g, "U")
      .replace(/ş/g, "s").replace(/Ş/g, "S")
      .replace(/ı/g, "i").replace(/İ/g, "I")
      .replace(/ö/g, "o").replace(/Ö/g, "O")
      .replace(/ç/g, "c").replace(/Ç/g, "C")
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
    + ext.toLowerCase()
  );
}

export async function uploadCopyfastImage({ supabase, projectId, itemId, file, imageType }) {
  const safeName = sanitizeFileName(file.name || "image.png");
  const path = `${projectId}/copyfast/${itemId}/${imageType}-${Date.now()}-${safeName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { publicUrl } = await uploadBufferToPublicBucket({
    supabase,
    bucket: COPYFAST_BUCKET,
    buffer,
    path,
    contentType: file.type || "image/png",
  });

  return publicUrl;
}

export function itemHasRequiredImage(item) {
  if (item.is_responsive) {
    return Boolean(item.web_image_url && item.mobile_image_url);
  }
  return Boolean(item.web_image_url);
}

export function getImageUrlsForAnalyze(item) {
  const urls = [];
  if (item.web_image_url) urls.push(item.web_image_url);
  if (item.is_responsive && item.mobile_image_url) urls.push(item.mobile_image_url);
  return urls;
}
