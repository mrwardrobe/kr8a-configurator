import { NextResponse } from 'next/server';
import { readSmallBody, verifiedOrigin } from './waitlistHttp';
import { manageSignup, type SignupResult } from './waitlistService';
import { waitlistDependencies } from './waitlistRuntime';
import { sealToken, waitlistManagementReady, waitlistOrigin, waitlistReady } from './waitlist';

export async function manageWaitlistRequest(request: Request, action: 'confirm' | 'unsubscribe') {
  let result: SignupResult = { status: 503, message: 'This service is temporarily unavailable.' };
  const wantsJson = request.headers.get('accept')?.includes('application/json');
  const ready = action === 'confirm' ? waitlistReady() : waitlistManagementReady();
  if (ready) {
    if (!verifiedOrigin(request, waitlistOrigin())) result = { status: 403, message: 'Request could not be verified.' };
    else {
      try {
        if (!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded')) throw new Error('Invalid content type');
        const data = new URLSearchParams(await readSmallBody(request));
        result = await manageSignup(data.get('token') || '', action, waitlistDependencies());
      } catch { result = { status: 400, message: 'Invalid request.' }; }
    }
  }
  const response = wantsJson ? NextResponse.json(result, { status: result.status }) : NextResponse.redirect(new URL('/early-access/confirmed', request.url), 303);
  response.headers.set('Cache-Control', 'private, no-store');
  // The status page trusts an authenticated result cookie, never ?status=ok.
  if (result.outcome) response.cookies.set('kr8a-email-result', sealToken({ outcome: result.outcome, timestamp: Date.now() }, process.env.WAITLIST_TOKEN_SECRET!, 'result'), { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 300, path: '/early-access' });
  else response.cookies.delete({ name: 'kr8a-email-result', path: '/early-access' });
  return response;
}
