/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
