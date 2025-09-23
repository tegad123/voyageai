import { GOOGLE_FORM } from '../../config/feedback';

export type FeedbackPayload = {
  q1: string;
  q2: string;
  lang: string;
  itineraryId?: string;
  timestampISO?: string;
};

function encodeForm(data: Record<string, string>): string {
  return Object.entries(data)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

async function postOnce(body: string): Promise<boolean> {
  const url = `https://docs.google.com/forms/d/e/${GOOGLE_FORM.FORM_ID}/formResponse`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

export async function sendFeedback(payload: FeedbackPayload): Promise<boolean> {
  const body = encodeForm({
    [GOOGLE_FORM.ENTRY.Q1]: payload.q1 ?? '',
    [GOOGLE_FORM.ENTRY.Q2]: payload.q2 ?? '',
    [GOOGLE_FORM.ENTRY.LANG]: payload.lang ?? 'English',
    ...(GOOGLE_FORM.ENTRY.ITIN_ID ? { [GOOGLE_FORM.ENTRY.ITIN_ID]: payload.itineraryId ?? '' } : {}),
    ...(GOOGLE_FORM.ENTRY.TS ? { [GOOGLE_FORM.ENTRY.TS]: payload.timestampISO ?? new Date().toISOString() } : {}),
  });

  for (let attempt = 0; attempt < 3; attempt++) {
    const ok = await postOnce(body);
    if (ok) return true;
    await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
  }
  return false;
}
