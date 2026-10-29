import { NextRequest, NextResponse } from 'next/server';
import { orderIntakeMode, receiveConfirmedOrder } from '../../../../lib/confirmedOrders';
import { createConfirmedOrderStore, orderRuntimeEnvironment } from '../../../../lib/confirmedOrderStore';
import { readSmallBody } from '../../../../lib/waitlistHttp';

export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  const env = orderRuntimeEnvironment(), mode = orderIntakeMode(env);
  if (!mode) return NextResponse.json({ message: 'Order intake is not enabled.' }, { status: 503 });
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') return NextResponse.json({ message: 'JSON required.' }, { status: 415 });
  let body: string;
  try { body = await readSmallBody(request); } catch { return NextResponse.json({ message: 'Invalid order body (maximum 4 KB).' }, { status: 400 }); }
  try {
    const result = await receiveConfirmedOrder(body, request.headers.get('x-kr8a-timestamp'), request.headers.get('x-kr8a-signature'), { mode, secret: env.signingSecret!, now: Date.now(), store: createConfirmedOrderStore(mode) });
    return NextResponse.json(result, { status: result.status, headers: { 'Cache-Control': 'private, no-store', ...(result.status === 503 ? { 'Retry-After': '30' } : {}) } });
  } catch { return NextResponse.json({ message: 'Order intake unavailable. Retry the same event.' }, { status: 503, headers: { 'Cache-Control': 'private, no-store', 'Retry-After': '30' } }); }
}
