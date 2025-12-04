/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Désactiver certaines optimisations pour accélérer le build
  experimental: {
    optimizePackageImports: ['@vercel/analytics', '@vercel/speed-insights'],
  },
}

module.exports = nextConfig

