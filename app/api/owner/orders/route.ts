import { NextResponse } from 'next/server';
import { ownerWorkspaceAvailable } from '../../../../lib/ownerAccess';
import { createConfirmedOrderStore } from '../../../../lib/confirmedOrderStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  // Existing deployment SSO protects the preview. Production remains inaccessible.
  if (!ownerWorkspaceAvailable(process.env.VERCEL_ENV, process.env.NODE_ENV)) return NextResponse.json({ message: 'Not found.' }, { status: 404 });
  const headers = { 'Cache-Control': 'private, no-store' };
  if (!process.env.ORDER_REDIS_REST_URL || !process.env.ORDER_REDIS_REST_TOKEN) return NextResponse.json({ message: 'Order storage is not connected. No customer orders are being received.', orders: [] }, { status: 503, headers });
  const offset = Number(new URL(request.url).searchParams.get('limit') || 20);
  if (!Number.isInteger(offset) || offset < 1 || offset > 100) return NextResponse.json({ message: 'Invalid limit.' }, { status: 400, headers });
  try { return NextResponse.json({ orders: await createConfirmedOrderStore('test').list(offset), mode: 'test' }, { headers }); }
  catch { return NextResponse.json({ message: 'Order queue could not be loaded. Please retry; do not assume the queue is empty.' }, { status: 503, headers }); }
}
