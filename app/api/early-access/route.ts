import { NextRequest, NextResponse } from 'next/server';
import { waitlistOrigin, waitlistReady } from '../../../lib/waitlist';
import { readSmallBody, verifiedOrigin } from '../../../lib/waitlistHttp';
import { requestSignup } from '../../../lib/waitlistService';
import { waitlistDependencies } from '../../../lib/waitlistRuntime';

export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  if (!waitlistReady()) return NextResponse.json({ message: 'Early access is not open yet.' }, { status: 503 });
  if (!verifiedOrigin(request, waitlistOrigin())) return NextResponse.json({ message: 'Request could not be verified.' }, { status: 403 });
  let data: Record<string, unknown>;
  try {
    if (!request.headers.get('content-type')?.startsWith('application/json')) throw new Error('Invalid type');
    data = JSON.parse(await readSmallBody(request));
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid body');
  } catch { return NextResponse.json({ message: 'Invalid request.' }, { status: 400 }); }
  // Vercel overwrites this header at its edge; never expose the value in events or logs.
  const ip = request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const result = await requestSignup(data, ip, waitlistDependencies());
  return NextResponse.json(result, { status: result.status, headers: { 'Cache-Control': 'private, no-store', ...(result.status === 429 ? { 'Retry-After': '900' } : {}) } });
}
