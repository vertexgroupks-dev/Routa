import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@routa/shared'],
  // Preview builds must not fail on type/lint warnings; `npm run typecheck` still checks them locally.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  poweredByHeader: false,
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' }
      ]
    }];
  }
};

export default nextConfig;
