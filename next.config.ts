import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: true
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "flowbite.s3.amazonaws.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
