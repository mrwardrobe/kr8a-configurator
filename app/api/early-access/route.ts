import { NextRequest, NextResponse } from 'next/server';
import { normalizeEmail, resendRequest, signConfirmation, waitlistReady } from '../../../lib/waitlist';
import { publicSiteUrl } from '../../../lib/site';

export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  if (!waitlistReady()) return NextResponse.json({ message: 'Early access is not open yet.' }, { status: 503 });
  const site = publicSiteUrl();
  if (!site || request.headers.get('origin') !== request.nextUrl.origin) return NextResponse.json({ message: 'Request could not be verified.' }, { status: 403 });
  if ((request.headers.get('content-length') && Number(request.headers.get('content-length')) > 4096) || !request.headers.get('content-type')?.includes('application/json')) return NextResponse.json({ message: 'Invalid request.' }, { status: 400 });
  let data: Record<string, unknown>;
  try { data = await request.json(); } catch { return NextResponse.json({ message: 'Invalid request.' }, { status: 400 }); }
  const email = normalizeEmail(data.email);
  if (!email || data.consent !== true) return NextResponse.json({ message: 'Enter a valid email and tick the consent box.' }, { status: 400 });
  if (data.website) return NextResponse.json({ message: 'Request could not be processed.' }, { status: 400 });
  if (typeof data.startedAt !== 'number' || Date.now() - data.startedAt < 3000 || Date.now() - data.startedAt > 3600000) return NextResponse.json({ message: 'Please reload the page and try again.' }, { status: 400 });
  if (typeof data.turnstile !== 'string' || !data.turnstile || data.turnstile.length > 2048) return NextResponse.json({ message: 'Complete the verification and try again.' }, { status: 400 });
  try {
    const challenge = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store',
      body: JSON.stringify({ secret: process.env.TURNSTILE_SECRET_KEY, response: data.turnstile }),
    });
    const verified = await challenge.json();
    if (!challenge.ok || verified.success !== true || verified.hostname !== request.nextUrl.hostname) return NextResponse.json({ message: 'Verification failed. Please try again.' }, { status: 400 });
    const token = signConfirmation(email, Date.now(), process.env.WAITLIST_TOKEN_SECRET!);
    const link = `${site}/early-access/confirm?token=${encodeURIComponent(token)}`;
    const emailResponse = await resendRequest('/emails', {
      from: process.env.RESEND_FROM_EMAIL, to: [email], subject: 'Confirm your KR8A early-access request',
      text: `Please confirm that you want KR8A launch and product updates by opening this link: ${link}\n\nIf you did not request this, ignore the email. This link expires in 48 hours.\n\nKR8A · ${site}/privacy`,
    });
    if (!emailResponse.ok) return NextResponse.json({ message: 'We could not send the confirmation email. Please try again later.' }, { status: 502 });
    return NextResponse.json({ message: 'Check your email for a confirmation link.' });
  } catch {
    return NextResponse.json({ message: 'The signup service is temporarily unavailable.' }, { status: 502 });
  }
}
