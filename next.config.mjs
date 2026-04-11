/** @type {import('next').NextConfig} */
const nextConfig = {
  /** geoip-lite reads MaxMind `.dat` files from its package folder; bundling breaks those paths. */
  serverExternalPackages: ["geoip-lite"],
  async redirects() {
    return [
      { source: "/login/callback", destination: "/login", permanent: false },
    ]
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    instrumentationHook: true,
  },
}

export default nextConfig