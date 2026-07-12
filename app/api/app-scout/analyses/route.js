export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('app_scout_analyses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ analyses: data });
  } catch (err) {
    console.error('GET analyses error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const body = await request.json();
    const { app_name, app_description, category, screenshots } = body;

    if (!app_name) {
      return NextResponse.json({ error: 'app_name zorunludur' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('app_scout_analyses')
      .insert({
        user_id: user.id,
        app_name,
        app_description: app_description || '',
        category: category || '',
        screenshots: screenshots || [],
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ analysis: data }, { status: 201 });
  } catch (err) {
    console.error('POST analyses error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
