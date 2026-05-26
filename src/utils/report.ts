import type { PainLog, ExerciseSession, Insight } from '@/src/types';
import { Strings } from '@/src/constants/strings';

const PRIMARY = '#3A7D6E';
const BG = '#F8FAF9';
const TEXT = '#1A2B2A';
const MUTED = '#6B7C7B';

/** Generate a styled HTML doctor report summarising the user's jaw health data. */
export function generateReport(opts: {
  painLogs: PainLog[];
  sessions: ExerciseSession[];
  insights: Insight[];
  symptoms: string[];
  streakDays: number;
}): string {
  const { painLogs, sessions, insights, symptoms, streakDays } = opts;

  // ── Pain summary ──
  const recent30 = painLogs.filter((l) => {
    const d = new Date(l.date).getTime();
    return d >= Date.now() - 30 * 86_400_000;
  });
  const avgPain =
    recent30.length > 0
      ? (recent30.reduce((s, l) => s + l.painLevel, 0) / recent30.length).toFixed(1)
      : 'N/A';
  const maxPain =
    recent30.length > 0 ? Math.max(...recent30.map((l) => l.painLevel)) : 0;
  const minPain =
    recent30.length > 0 ? Math.min(...recent30.map((l) => l.painLevel)) : 0;

  // ── 7-day pain bars (SVG) ──
  const last7: { label: string; avg: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    const iso = d.toISOString().split('T')[0];
    const dayLogs = painLogs.filter((l) => l.date.startsWith(iso));
    const avg =
      dayLogs.length > 0
        ? dayLogs.reduce((s, l) => s + l.painLevel, 0) / dayLogs.length
        : 0;
    const label = d.toLocaleDateString('en-GB', { weekday: 'short' });
    last7.push({ label, avg });
  }

  const barMax = 10;
  const barH = 120;
  const barW = 36;
  const gap = 8;
  const chartW = last7.length * (barW + gap);
  const bars = last7
    .map((d, i) => {
      const h = Math.max((d.avg / barMax) * barH, 2);
      const x = i * (barW + gap);
      const y = barH - h;
      const fill = d.avg > 6 ? '#E74C3C' : d.avg > 3 ? '#F39C12' : PRIMARY;
      return `
        <rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="4" fill="${fill}" />
        <text x="${x + barW / 2}" y="${barH + 16}" text-anchor="middle"
              font-size="11" fill="${MUTED}">${d.label}</text>
        <text x="${x + barW / 2}" y="${y - 4}" text-anchor="middle"
              font-size="10" fill="${TEXT}">${d.avg > 0 ? d.avg.toFixed(1) : ''}</text>`;
    })
    .join('');

  // ── Exercise adherence ──
  const totalSessions = sessions.length;
  const totalMin = Math.round(
    sessions.reduce((s, e) => s + e.totalDuration, 0) / 60,
  );
  const exerciseDates = new Set(sessions.map((s) => s.date.split('T')[0]));
  const last30Days = Array.from({ length: 30 }, (_, i) =>
    new Date(Date.now() - i * 86_400_000).toISOString().split('T')[0],
  );
  const activeDays30 = last30Days.filter((d) => exerciseDates.has(d)).length;
  const adherencePct = Math.round((activeDays30 / 30) * 100);

  // ── Trigger frequency ──
  const triggerCounts: Record<string, number> = {};
  painLogs.forEach((l) => {
    l.triggers?.forEach((t) => {
      triggerCounts[t] = (triggerCounts[t] || 0) + 1;
    });
  });
  const triggerRows = Object.entries(triggerCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(
      ([key, count]) =>
        `<tr><td style="padding:6px 12px">${Strings.triggers[key as keyof typeof Strings.triggers] ?? key}</td>
         <td style="padding:6px 12px;text-align:right">${count} times</td></tr>`,
    )
    .join('');

  // ── Insights ──
  const insightRows = insights
    .slice(0, 5)
    .map(
      (ins) =>
        `<div style="padding:10px 14px;background:#fff;border-radius:8px;border-left:3px solid ${PRIMARY};margin-bottom:8px">
          <strong style="font-size:14px;color:${TEXT}">${ins.title}</strong>
          <p style="margin:4px 0 0;font-size:13px;color:${MUTED}">${ins.message}</p>
        </div>`,
    )
    .join('');

  // ── Symptom pills ──
  const symptomPills = symptoms
    .map(
      (s) =>
        `<span style="display:inline-block;padding:4px 12px;border-radius:12px;background:${PRIMARY}20;color:${PRIMARY};font-size:12px;font-weight:600;margin:2px 4px">${Strings.symptoms[s as keyof typeof Strings.symptoms] ?? s}</span>`,
    )
    .join('');

  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;margin:0;padding:24px;background:${BG};color:${TEXT}}
  .header{text-align:center;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid ${PRIMARY}}
  .header h1{color:${PRIMARY};margin:0;font-size:22px}
  .header p{color:${MUTED};margin:4px 0 0;font-size:13px}
  .section{margin-bottom:20px}
  .section h2{color:${PRIMARY};font-size:16px;margin:0 0 10px;border-bottom:1px solid #E0E0E0;padding-bottom:6px}
  .stat-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px}
  .stat{background:#fff;padding:12px;border-radius:10px;text-align:center}
  .stat .val{font-size:24px;font-weight:700;color:${PRIMARY}}
  .stat .lbl{font-size:11px;color:${MUTED};margin-top:2px}
  table{width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden}
  tr:nth-child(even){background:#FAFAFA}
  .footer{text-align:center;margin-top:24px;padding-top:16px;border-top:1px solid #E0E0E0;color:${MUTED};font-size:11px}
</style></head>
<body>
  <div class="header">
    <h1>JawEase Health Report</h1>
    <p>Generated ${today}</p>
  </div>

  <div class="section">
    <h2>Patient Symptoms</h2>
    <div style="margin-bottom:8px">${symptomPills || '<span style="color:' + MUTED + '">None recorded</span>'}</div>
  </div>

  <div class="section">
    <h2>Pain Summary (Last 30 Days)</h2>
    <div class="stat-grid">
      <div class="stat"><div class="val">${avgPain}</div><div class="lbl">Average Pain</div></div>
      <div class="stat"><div class="val">${recent30.length > 0 ? minPain : 'N/A'}</div><div class="lbl">Lowest</div></div>
      <div class="stat"><div class="val">${recent30.length > 0 ? maxPain : 'N/A'}</div><div class="lbl">Highest</div></div>
    </div>
    <p style="font-size:13px;color:${MUTED}">${recent30.length} entries recorded in last 30 days</p>
  </div>

  <div class="section">
    <h2>7-Day Pain Trend</h2>
    <svg width="${chartW}" height="${barH + 24}" viewBox="0 0 ${chartW} ${barH + 24}" style="display:block;margin:0 auto">
      ${bars}
    </svg>
  </div>

  <div class="section">
    <h2>Exercise Adherence</h2>
    <div class="stat-grid">
      <div class="stat"><div class="val">${totalSessions}</div><div class="lbl">Total Sessions</div></div>
      <div class="stat"><div class="val">${totalMin}</div><div class="lbl">Minutes Exercised</div></div>
      <div class="stat"><div class="val">${adherencePct}%</div><div class="lbl">30-Day Adherence</div></div>
    </div>
    <p style="font-size:13px;color:${MUTED}">Current streak: ${streakDays} day${streakDays !== 1 ? 's' : ''}</p>
  </div>

  ${triggerRows ? `<div class="section">
    <h2>Reported Triggers</h2>
    <table>${triggerRows}</table>
  </div>` : ''}

  ${insightRows ? `<div class="section">
    <h2>AI-Generated Insights</h2>
    ${insightRows}
  </div>` : ''}

  <div class="footer">
    <p>This report was generated by JawEase and is intended to support clinical conversations.<br/>
    It is not a medical diagnosis. Please consult your healthcare provider.</p>
  </div>
</body></html>`;
}
