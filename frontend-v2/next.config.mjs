/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const backendUrl = (process.env.BACKEND_API_URL ?? "http://localhost:4000").replace(/\/$/, "")

    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
