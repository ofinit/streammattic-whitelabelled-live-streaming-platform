/** @type {import('next').NextConfig} */
const nextConfig = {
  /** geoip-lite reads MaxMind `.dat` files from its package folder; bundling breaks those paths. */
  serverExternalPackages: ["geoip-lite"],
  async redirects() {
    return [
      { source: "/login/callback", destination: "/login", permanent: false },
    ]
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
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