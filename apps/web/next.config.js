const path = require('path');

const isStandalone = process.env.OUTPUT_STANDALONE === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: isStandalone ? 'standalone' : undefined,
  ...(isStandalone
    ? {
        experimental: {
          outputFileTracingRoot: path.join(__dirname, '../../'),
        },
      }
    : {}),
  async rewrites() {
    const gatewayUrl = process.env.GATEWAY_INTERNAL_URL || 'http://127.0.0.1:4001';
    return [
      {
        source: '/api/:path*',
        destination: `${gatewayUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
