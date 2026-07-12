export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

async function fetchItunesCompetitors(appName) {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(appName)}&entity=software&limit=10&country=tr`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.results || []).map((r) => ({
      trackName: r.trackName,
      sellerName: r.sellerName,
      averageUserRating: r.averageUserRating,
      userRatingCount: r.userRatingCount,
      price: r.price,
      primaryGenreName: r.primaryGenreName,
      description: (r.description || '').slice(0, 300),
    }));
  } catch (err) {
    console.error('iTunes fetch error:', err);
    return [];
  }
}

async function callAI(prompt) {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (groqKey) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Groq API hatası (${res.status}): ${errText}`);
    }

    const json = await res.json();
    const rawText = json.choices?.[0]?.message?.content || '{}';
    return JSON.parse(rawText.trim());
  }

  if (!geminiKey) throw new Error('Yapay zeka API key (GROQ_API_KEY veya GEMINI_API_KEY) tanımlı değil');

  const res = await fetch(`${GEMINI_API_URL}?key=${geminiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: 'application/json',
      },
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API hatası (${res.status}): ${errText}`);
  }

  const json = await res.json();
  const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  return JSON.parse(cleaned);
}

export async function POST(_request, { params }) {
  const { id } = await params;
  try {
    const supabase = await createClient();

    // 1. DB'den analizi çek
    const { data: analysis, error: fetchError } = await supabase
      .from('app_scout_analyses')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !analysis) {
      return NextResponse.json({ error: 'Analiz bulunamadı' }, { status: 404 });
    }

    // Status'ü analyzing olarak güncelle
    await supabase
      .from('app_scout_analyses')
      .update({ status: 'analyzing', updated_at: new Date().toISOString() })
      .eq('id', id);

    // 2. iTunes Search API
    const competitors = await fetchItunesCompetitors(analysis.app_name);

    // 3. Gemini prompt
    const screenshotText =
      analysis.screenshots && analysis.screenshots.length > 0
        ? `\nEkran görüntüleri mevcut (${analysis.screenshots.length} adet): ${analysis.screenshots.join(', ')}`
        : '';

    const prompt = `Bir iOS uygulaması için pazar analizi yap.

Uygulama: ${analysis.app_name}
Açıklama: ${analysis.app_description || 'Belirtilmemiş'}
Kategori: ${analysis.category || 'Belirtilmemiş'}${screenshotText}

App Store'daki rakipler (iTunes API verisi):
${JSON.stringify(competitors, null, 2)}

Analiz et ve şu JSON formatında cevap ver:
{
  "market_analysis": "...",
  "competition_level": "low|medium|high",
  "opportunity_score": 0-100,
  "revenue_estimate": "~$X-Y/ay",
  "verdict": "Kısa karar: yapılabilir mi?",
  "verdict_color": "green|yellow|red",
  "strengths": ["..."],
  "risks": ["..."],
  "recommendation": "..."
}

SADECE JSON döndür, başka metin ekleme.`;

    const aiResult = await callAI(prompt);

    // 4 & 5. DB'yi güncelle
    const { data: updated, error: updateError } = await supabase
      .from('app_scout_analyses')
      .update({
        competitors,
        ai_analysis: aiResult,
        opportunity_score: aiResult.opportunity_score || 0,
        revenue_estimate: aiResult.revenue_estimate || '',
        verdict: aiResult.verdict || '',
        verdict_color: aiResult.verdict_color || 'gray',
        status: 'done',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ analysis: updated });
  } catch (err) {
    console.error('Analyze route error:', err);

    // Hata durumunda status'ü error'a çek
    try {
      const supabase = await createClient();
      await supabase
        .from('app_scout_analyses')
        .update({ status: 'error', updated_at: new Date().toISOString() })
        .eq('id', id);
    } catch (_) {
      // ignore secondary error
    }

    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
