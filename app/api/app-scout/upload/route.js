export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files');

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const uploadedUrls = [];

    for (const file of files) {
      if (!(file instanceof File)) continue;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const ext = file.name.split('.').pop() || 'png';
      const fileName = `screenshots/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from('app-scout')
        .upload(fileName, buffer, {
          contentType: file.type || 'image/png',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const { data: publicUrlData } = supabase.storage
        .from('app-scout')
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrlData.publicUrl);
    }

    return NextResponse.json({ urls: uploadedUrls });
  } catch (err) {
    console.error('Upload route error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
