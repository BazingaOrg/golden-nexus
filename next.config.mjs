/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "golden-nexus.vercel.app"],
    },
    serverComponentsExternalPackages: ["sharp"],
  },
};

export default nextConfig;
