/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permet de servir les fichiers statiques à la racine
  // Les fichiers HTML dans public/ seront servis automatiquement
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig

