import { Config } from '@/src/constants/config';

const FROM = 'JawEase <noreply@jawease.app>';
const PRIMARY = '#3A7D6E';

// ─── Shared HTML wrapper ─────────────────────────────────
function emailTemplate(title: string, body: string, cta?: { label: string; url: string }): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#F8FAF9">
  <div style="max-width:480px;margin:0 auto;padding:32px 24px">
    <div style="text-align:center;padding-bottom:20px;border-bottom:2px solid ${PRIMARY}">
      <h1 style="margin:0;font-size:20px;color:${PRIMARY}">JawEase</h1>
    </div>
    <h2 style="margin:24px 0 8px;font-size:18px;color:#1A2B2A">${title}</h2>
    <div style="font-size:15px;line-height:24px;color:#4A5A59">${body}</div>
    ${cta ? `<div style="text-align:center;margin:28px 0">
      <a href="${cta.url}" style="display:inline-block;padding:14px 32px;background:${PRIMARY};color:#fff;border-radius:12px;text-decoration:none;font-weight:600;font-size:15px">${cta.label}</a>
    </div>` : ''}
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #E0E0E0;font-size:11px;color:#999;text-align:center">
      <p>You received this because you signed up for JawEase.</p>
    </div>
  </div>
</body></html>`;
}

// ─── Send helper ─────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const { apiKey } = Config.resend;
  if (!apiKey) return false;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Add contact to audience ─────────────────────────────
interface AddContactParams {
  email: string;
  firstName?: string;
}

export async function addEmailToAudience({
  email,
  firstName,
}: AddContactParams): Promise<boolean> {
  const { apiKey, audienceId } = Config.resend;
  if (!apiKey || !audienceId) return false;

  try {
    const response = await fetch(
      `https://api.resend.com/audiences/${audienceId}/contacts`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          first_name: firstName ?? '',
          unsubscribed: false,
        }),
      },
    );
    return response.ok;
  } catch {
    return false;
  }
}

// ─── Day 1: Nudge (no exercise yet) ─────────────────────
export async function sendNudgeEmail(email: string): Promise<boolean> {
  return sendEmail(
    email,
    'Your jaw exercises are waiting',
    emailTemplate(
      'Ready for your first session?',
      `<p>You signed up for JawEase yesterday — great first step!</p>
       <p>Most people notice a difference after just one 5-minute session. Your personalised routine is ready and waiting.</p>
       <p>Just open the app and tap <strong>Start Routine</strong>.</p>`,
      { label: 'Open JawEase', url: 'jawease://exercise-flow/routine' },
    ),
  );
}

// ─── Day 3: Trial expiring ──────────────────────────────
export async function sendTrialExpiryEmail(email: string): Promise<boolean> {
  return sendEmail(
    email,
    'Your free trial ends tomorrow',
    emailTemplate(
      'Your trial is almost over',
      `<p>You have <strong>1 day left</strong> on your JawEase free trial.</p>
       <p>Upgrade now to keep access to:</p>
       <ul style="padding-left:20px">
         <li>Unlimited guided exercises</li>
         <li>Pain analytics &amp; insights</li>
         <li>Doctor-ready reports</li>
       </ul>
       <p>Don't lose your progress!</p>`,
      { label: 'Upgrade Now', url: 'jawease://paywall?mode=upgrade' },
    ),
  );
}

// ─── Day 7: Win-back ────────────────────────────────────
export async function sendWinBackEmail(email: string): Promise<boolean> {
  return sendEmail(
    email,
    'We miss you — your jaw doesn\'t have to hurt',
    emailTemplate(
      'Come back to JawEase',
      `<p>It's been a week since you signed up, and we want to make sure you're not still suffering.</p>
       <p>TMJ exercises work best with consistency. Even 5 minutes a day can reduce jaw pain, headaches, and tension.</p>
       <p>Your personalised routine is still here, ready when you are.</p>`,
      { label: 'Reopen JawEase', url: 'jawease://exercise-flow/routine' },
    ),
  );
}
