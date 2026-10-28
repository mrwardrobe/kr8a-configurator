/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    const noindex = { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' };
    return [
      { source: '/:path*', headers: [
        { key: 'Referrer-Policy', value: 'no-referrer' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        { key: 'Content-Security-Policy', value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'" },
        ...(process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production' ? [noindex] : []),
      ] },
      { source: '/:path*', has: [{ type: 'host', value: '.*\\.vercel\\.app' }], headers: [noindex] },
      { source: '/early-access/:path*', headers: [noindex, { key: 'Cache-Control', value: 'private, no-store' }] },
      { source: '/api/:path*', headers: [noindex, { key: 'Cache-Control', value: 'private, no-store' }] },
      { source: '/owner/:path*', headers: [noindex, { key: 'Cache-Control', value: 'private, no-store' }] },
      { source: '/fonts/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
    ];
  },
}

module.exports = nextConfig
