/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  },
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'agam-backend.onrender.com'],
  },
  output: 'standalone',
}

module.exports = nextConfig 