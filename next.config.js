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
  output: 'standalone',

  // Configure allowed image domains
  images: {
    domains: ['storage.googleapis.com'],
    // Optional: configure remotePatterns for more specific control
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/memorial-voices/**',
      },
    ],
  },
  
  // Disable automatic port switching if 3000 is in use
  experimental: {
    strictNextHead: true,
  }
};

module.exports = nextConfig;
