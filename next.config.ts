import type { NextConfig } from 'next'

// Derive allowed origins from NEXT_PUBLIC_BASE_URL so both local dev and the
// live domain are accepted without hard-coding the hostname here.
function getAllowedOrigins(): string[] {
  const origins = ['localhost:3000']
  const base = process.env.NEXT_PUBLIC_BASE_URL
  if (base) {
    try {
      const { host } = new URL(base)
      if (host && !origins.includes(host)) origins.push(host)
    } catch {
      // ignore malformed URL
    }
  }
  return origins
}

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: getAllowedOrigins(),
    },
  },
  serverExternalPackages: ['jspdf', 'html2canvas'],
}

export default nextConfig
