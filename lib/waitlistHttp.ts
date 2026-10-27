// Bound the stream itself: Content-Length is untrusted and can be absent.
export async function readSmallBody(request: Request): Promise<string> {
  if (Number(request.headers.get('content-length')) > 4096) throw new Error('Request too large');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Missing body');
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 4096) { await reader.cancel(); throw new Error('Request too large'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks).toString('utf8');
}

export function verifiedOrigin(request: Request, expected: string | null): boolean {
  return Boolean(expected && new URL(request.url).origin === expected && request.headers.get('origin') === expected && request.headers.get('sec-fetch-site') !== 'cross-site');
}
