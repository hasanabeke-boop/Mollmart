import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_URL;

const nextConfig: NextConfig = {
  output: "standalone",
  ...(apiUrl ? { env: { NEXT_PUBLIC_API_URL: apiUrl } } : {}),
};

export default nextConfig;
