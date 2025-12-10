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
  // Configuration CSP pour Vercel Analytics et Speed Insights
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://vercel.live",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://va.vercel-scripts.com https://vercel.live https://*.vercel-insights.com",
              "frame-src 'self' https://vercel.live",
            ].join('; ')
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
