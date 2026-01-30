/**@type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Fix for Google Drive "My Drive" path issue
  experimental: {
    // Disable turbopack for better compatibility
    turbo: false
  }
}

module.exports = nextConfig
