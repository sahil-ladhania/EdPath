import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/schemas", "@repo/types"],
};

export default nextConfig;
