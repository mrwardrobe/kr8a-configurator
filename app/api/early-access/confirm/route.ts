import { NextRequest, NextResponse } from 'next/server';
import { resendRequest, verifyConfirmation, waitlistReady, CONSENT_VERSION } from '../../../../lib/waitlist';
import { publicSiteUrl } from '../../../../lib/site';

export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  if (!waitlistReady()) return NextResponse.redirect(new URL('/early-access/confirmed?status=unavailable', request.url), 303);
  const site = publicSiteUrl();
  if (!site || request.headers.get('origin') !== request.nextUrl.origin) return NextResponse.redirect(new URL('/early-access/confirmed?status=invalid', request.url), 303);
  const data = await request.formData();
  const token = data.get('token');
  const verified = typeof token === 'string' ? verifyConfirmation(token, process.env.WAITLIST_TOKEN_SECRET!) : null;
  if (!verified) return NextResponse.redirect(new URL('/early-access/confirmed?status=invalid', request.url), 303);
  try {
    const path = `/contacts/${encodeURIComponent(verified.email)}`;
    const existing = await resendRequest(path, undefined, 'GET');
    if (existing.status !== 404 && !existing.ok) return NextResponse.redirect(new URL('/early-access/confirmed?status=error', request.url), 303);
    const properties = { kr8a_consent_at: new Date(verified.timestamp).toISOString(), kr8a_confirmed_at: new Date().toISOString(), kr8a_consent_version: CONSENT_VERSION };
    if (existing.ok) {
      const contact = await existing.json();
      if (contact.unsubscribed === true) return NextResponse.redirect(new URL('/early-access/confirmed?status=error', request.url), 303);
      const updated = await resendRequest(path, { properties }, 'PATCH');
      if (!updated.ok) return NextResponse.redirect(new URL('/early-access/confirmed?status=error', request.url), 303);
      const segmented = await resendRequest(`${path}/segments/${encodeURIComponent(process.env.RESEND_SEGMENT_ID!)}`);
      if (!segmented.ok) return NextResponse.redirect(new URL('/early-access/confirmed?status=error', request.url), 303);
    } else {
      const created = await resendRequest('/contacts', { email: verified.email, unsubscribed: false, segments: [{ id: process.env.RESEND_SEGMENT_ID }], properties });
      if (!created.ok) return NextResponse.redirect(new URL('/early-access/confirmed?status=error', request.url), 303);
    }
    return NextResponse.redirect(new URL('/early-access/confirmed?status=ok', request.url), 303);
  } catch {
    return NextResponse.redirect(new URL('/early-access/confirmed?status=error', request.url), 303);
  }
}
