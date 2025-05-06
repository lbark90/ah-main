/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.infrastructureLogging = {
      level: 'error',
    };
    return config;
  },
  
  // CHANGE: Remove conditional for assetPrefix - let Next.js handle it automatically
  // assetPrefix: process.env.NODE_ENV === 'development' ? undefined : '',
  
  // KEEP: Standalone output mode
  output: 'standalone',

  // ADD: Explicitly set the distDir for clarity
  distDir: '.next',

  // ADD: Configure public directory for standalone mode
  useFileSystemPublicRoutes: true,

  // KEEP: Configure allowed image domains
  images: {
    domains: ['storage.googleapis.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/memorial-voices/**',
      },
    ],
  },
  
  // KEEP: Experimental features
  experimental: {
    strictNextHead: true,
  }
};

module.exports = nextConfig;