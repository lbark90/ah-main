
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.infrastructureLogging = {
      level: 'error',
    };
    return config;
  },
  
  assetPrefix: process.env.NODE_ENV === 'development' ? undefined : '',
  output: 'standalone'
}

module.exports = nextConfig
