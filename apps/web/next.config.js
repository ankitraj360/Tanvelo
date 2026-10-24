const path = require('path');

const isStandalone = process.env.OUTPUT_STANDALONE === 'true';

function getGatewayUrl() {
  const url = process.env.GATEWAY_URL || process.env.GATEWAY_INTERNAL_URL;
  if (url && url.trim()) {
    return url.trim().replace(/\/+$/, '');
  }
  return 'https://tanvelo-backend-zgyc.onrender.com';
}

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
    const gateway = getGatewayUrl();
    return [
      // 1. Any request with Host: api.tanvelo.xyz forwards directly to the gateway
      {
        has: [
          {
            type: 'host',
            value: 'api.tanvelo.xyz',
          },
        ],
        source: '/:path*',
        destination: `${gateway}/:path*`,
      },
      // 2. Direct OpenAI-compatible /v1 endpoints
      {
        source: '/v1/:path*',
        destination: `${gateway}/v1/:path*`,
      },
      // 3. /api/v1 endpoints
      {
        source: '/api/v1/:path*',
        destination: `${gateway}/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
