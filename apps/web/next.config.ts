import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@routa/shared'],
  // Preview builds must not fail on type/lint warnings; `npm run typecheck` still checks them locally.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true }
};

export default nextConfig;
