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
};

module.exports = nextConfig;
