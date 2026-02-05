/** @type {import('next').NextConfig} */
// Next.js configuration
// - Enables React strict mode for development
// - Configures webpack for Web3 libraries (wagmi, viem)
// - Sets up environment variables access
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
}

module.exports = nextConfig
