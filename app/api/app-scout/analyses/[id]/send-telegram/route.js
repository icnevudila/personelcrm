export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendMessage } from '@/lib/telegram/client';

function formatAnalysisReport(analysis) {
  const ai = analysis.ai_analysis || {};
  const verdictEmoji =
    analysis.verdict_color === 'green'
      ? '🟢'
      : analysis.verdict_color === 'yellow'
      ? '🟡'
      : '🔴';

  const strengths = Array.isArray(ai.strengths)
    ? ai.strengths.map((s) => `  • ${s}`).join('\n')
    : '';
  const risks = Array.isArray(ai.risks)
    ? ai.risks.map((r) => `  • ${r}`).join('\n')
    : '';

  return `${verdictEmoji} *App Scout Analiz Raporu*

📱 *Uygulama:* ${analysis.app_name}
📂 *Kategori:* ${analysis.category || '-'}
🎯 *Fırsat Skoru:* ${analysis.opportunity_score}/100
💰 *Tahmini Gelir:* ${analysis.revenue_estimate || '-'}
🏁 *Karar:* ${analysis.verdict || '-'}

📊 *Pazar Analizi:*
${ai.market_analysis || '-'}

💪 *Güçlü Yönler:*
${strengths || '-'}

⚠️ *Riskler:*
${risks || '-'}

💡 *Öneri:*
${ai.recommendation || '-'}

🏆 *Rekabet Seviyesi:* ${ai.competition_level || '-'}`;
}

export async function POST(_request, { params }) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Analizi çek
    const { data: analysis, error: fetchError } = await supabase
      .from('app_scout_analyses')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !analysis) {
      return NextResponse.json({ error: 'Analiz bulunamadı' }, { status: 404 });
    }

    if (analysis.status !== 'done') {
      return NextResponse.json(
        { error: 'Analiz henüz tamamlanmamış. Önce analizi çalıştırın.' },
        { status: 400 }
      );
    }

    const chatId = process.env.TELEGRAM_ALLOWED_USER_ID;
    if (!chatId) {
      return NextResponse.json(
        { error: 'TELEGRAM_ALLOWED_USER_ID env tanımlı değil' },
        { status: 500 }
      );
    }

    const message = formatAnalysisReport(analysis);
    await sendMessage(chatId, message, { parseMode: 'Markdown' });

    // telegram_sent flag'ini güncelle
    await supabase
      .from('app_scout_analyses')
      .update({ telegram_sent: true, updated_at: new Date().toISOString() })
      .eq('id', id);

    return NextResponse.json({ success: true, message: 'Telegram\'a gönderildi' });
  } catch (err) {
    console.error('Send telegram error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
