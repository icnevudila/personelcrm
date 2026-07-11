import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/isAdmin";
import { requireProjectAccess } from "@/lib/projectCopy/context";
import { uploadCopyfastImage } from "@/lib/copyfast/server";

const IMAGE_TYPES = ["web", "mobile"];

function getStorageClient() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

export async function POST(request, { params }) {
  const { id: projectId, itemId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const allowed = await requireProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const { data: item } = await supabase
    .from("copyfast_items")
    .select("id")
    .eq("id", itemId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (!item) return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get("file");
  const imageType = formData.get("image_type") || "web";

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Dosya gerekli" }, { status: 400 });
  }
  if (!IMAGE_TYPES.includes(imageType)) {
    return NextResponse.json({ error: "Geçersiz görsel tipi" }, { status: 400 });
  }
  if (!file.type?.startsWith("image/")) {
    return NextResponse.json({ error: "Yalnızca görsel dosyaları yüklenebilir" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Dosya 10 MB sınırını aşıyor" }, { status: 400 });
  }

  const storageClient = getStorageClient() ?? supabase;

  try {
    const publicUrl = await uploadCopyfastImage({
      supabase: storageClient,
      projectId,
      itemId,
      file,
      imageType,
    });

    const column = imageType === "mobile" ? "mobile_image_url" : "web_image_url";
    const { data, error } = await supabase
      .from("copyfast_items")
      .update({
        [column]: publicUrl,
        generated_prompt: "",
        status: "pending",
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId)
      .eq("project_id", projectId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message || "Yükleme hatası" }, { status: 500 });
  }
}
