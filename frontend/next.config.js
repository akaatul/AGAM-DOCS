/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: 'https://agam-backend.onrender.com/api',
  },
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['agam-backend.onrender.com'],
  },
  output: 'standalone',
}

module.exports = nextConfig 